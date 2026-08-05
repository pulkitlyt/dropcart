import Redis from 'ioredis'

/**
 * Lazily-created Redis client.
 *
 * Redis is an *optimisation* here, not a dependency: if it is unavailable the
 * flash-sale checkout falls back to the mongo-atomic path, which is already
 * correct on its own. So every helper below reports failure rather than
 * throwing, and the client never retries forever — a dead Redis must degrade
 * fast, not hang the request behind a connection timeout.
 */
let client = null
let disabled = false

const getClient = () => {
	if (disabled) return null
	if (client) return client

	const url = process.env.REDIS_URL
	if (!url) {
		disabled = true
		return null
	}

	client = new Redis(url, {
		maxRetriesPerRequest: 1,
		connectTimeout: 2000,
		retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
	})

	client.on('error', (error) => {
		// Log once per transition rather than once per failed command.
		if (!client.loggedError) {
			console.warn('Redis unavailable, falling back to mongo:', error.message)
			client.loggedError = true
		}
	})

	client.on('ready', () => {
		client.loggedError = false
		console.log('Redis connected')
	})

	return client
}

const isReady = () => {
	const redis = getClient()
	return Boolean(redis && redis.status === 'ready')
}

const stockKey = (flashSaleId) => `flashsale:${flashSaleId}:stock`

/** Seeds the counter from the authoritative mongo value. */
const seedStock = async (flashSaleId, remainingStock) => {
	if (!isReady()) return false
	try {
		// Expire well after any sale can end, so a stale counter can never
		// outlive the sale it belongs to.
		await getClient().set(stockKey(flashSaleId), remainingStock, 'EX', 60 * 60 * 24)
		return true
	} catch {
		return false
	}
}

/**
 * Atomically claims one unit. Returns { ok, remaining } — never throws.
 *
 * DECR is atomic within redis' single-threaded command loop, so concurrent
 * callers are serialised the same way findOneAndUpdate serialises them in
 * mongo — but in memory, with no disk round-trip.
 */
const claimStock = async (flashSaleId) => {
	if (!isReady()) return { ok: false, reason: 'unavailable' }

	try {
		const remaining = await getClient().decr(stockKey(flashSaleId))

		if (remaining < 0) {
			// Overshot past zero: put it back so the counter cannot drift
			// negative and permanently under-report availability.
			await getClient().incr(stockKey(flashSaleId))
			return { ok: false, reason: 'sold-out', remaining: 0 }
		}

		return { ok: true, remaining }
	} catch {
		return { ok: false, reason: 'unavailable' }
	}
}

/** Compensating return of one unit after a downstream failure. */
const releaseStock = async (flashSaleId) => {
	if (!isReady()) return false
	try {
		await getClient().incr(stockKey(flashSaleId))
		return true
	} catch {
		return false
	}
}

const getStock = async (flashSaleId) => {
	if (!isReady()) return null
	try {
		const value = await getClient().get(stockKey(flashSaleId))
		return value === null ? null : Number(value)
	} catch {
		return null
	}
}

export { getClient, isReady, seedStock, claimStock, releaseStock, getStock, stockKey }
