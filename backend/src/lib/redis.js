import Redis from 'ioredis'


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

const seedStock = async (flashSaleId, remainingStock) => {
	if (!isReady()) return false
	try {
	
		await getClient().set(stockKey(flashSaleId), remainingStock, 'EX', 60 * 60 * 24)
		return true
	} catch {
		return false
	}
}


const claimStock = async (flashSaleId) => {
	if (!isReady()) return { ok: false, reason: 'unavailable' }

	try {
		const remaining = await getClient().decr(stockKey(flashSaleId))

		if (remaining < 0) {
		
			await getClient().incr(stockKey(flashSaleId))
			return { ok: false, reason: 'sold-out', remaining: 0 }
		}

		return { ok: true, remaining }
	} catch {
		return { ok: false, reason: 'unavailable' }
	}
}

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
