/**
 * Race-condition harness: naive vs atomic flash-sale checkout.
 *
 * The artillery configs in this folder fire every request as the SAME user, so
 * the per-user reservation limit rejects almost all of them and the race is
 * never actually exercised. This script provisions one distinct buyer per
 * concurrent request, which is what a real stampede looks like.
 *
 *   node loadtests/race-test.mjs [concurrency] [saleStock]
 *
 * Runs three checkout strategies against an identical sale and reports how many
 * units each oversold, plus wall-clock time for the whole stampede:
 *   naive  - read-then-write in application code   (broken by design)
 *   atomic - mongo findOneAndUpdate as the gate    (correct, disk-backed)
 *   redis  - redis DECR as the gate                (correct, in-memory)
 */
import mongoose from '../backend/node_modules/mongoose/index.js'
import fs from 'node:fs'

const API = process.env.API_URL || 'http://localhost:8000/api/v1'
const CONCURRENCY = Number(process.argv[2]) || 200
const SALE_STOCK = Number(process.argv[3]) || 20
const PASSWORD = 'racetest123'

const uri = fs
	.readFileSync(new URL('../backend/.env', import.meta.url), 'utf8')
	.split('\n')
	.find((line) => line.startsWith('MONGODB_URI='))
	.slice('MONGODB_URI='.length)
	.trim()

const api = async (path, { method = 'GET', body, token, idempotencyKey } = {}) => {
	const response = await fetch(`${API}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	})
	return { status: response.status, payload: await response.json().catch(() => null) }
}

await mongoose.connect(uri)
const db = mongoose.connection.db

const cleanup = async () => {
	await db.collection('users').deleteMany({ email: /^racetest-/ })
	const products = await db.collection('products').find({ name: /^RaceTest/ }).toArray()
	const ids = products.map((p) => p._id)
	await db.collection('orders').deleteMany({ $or: [{ product: { $in: ids } }, { 'items.product': { $in: ids } }] })
	await db.collection('reservations').deleteMany({ product: { $in: ids } })
	await db.collection('flashsales').deleteMany({ product: { $in: ids } })
	await db.collection('products').deleteMany({ _id: { $in: ids } })
}

console.log('Cleaning previous race-test data...')
await cleanup()

// --- provision seller, product, buyers -------------------------------------
await api('/auth/register', {
	method: 'POST',
	body: { name: 'RaceTest Seller', email: 'racetest-seller@test.local', password: PASSWORD, role: 'seller' },
})
const sellerLogin = await api('/auth/login', {
	method: 'POST',
	body: { email: 'racetest-seller@test.local', password: PASSWORD },
})
const sellerId = sellerLogin.payload.data._id

// Tokens are minted directly so we don't need cookie handling in this script.
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users')
const jwt = (await import('../backend/node_modules/jsonwebtoken/index.js')).default
const env = Object.fromEntries(
	fs
		.readFileSync(new URL('../backend/.env', import.meta.url), 'utf8')
		.split('\n')
		.filter((l) => l.includes('='))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const tokenFor = (user) =>
	jwt.sign({ _id: user._id, email: user.email, name: user.name, role: user.role }, env.ACCESS_TOKEN_SECRET, {
		expiresIn: '30m',
	})

const seller = await User.findById(sellerId).lean()
const sellerToken = tokenFor(seller)

console.log(`Provisioning ${CONCURRENCY} buyers...`)
await Promise.all(
	Array.from({ length: CONCURRENCY }, (_, i) =>
		api('/auth/register', {
			method: 'POST',
			body: { name: `RaceTest Buyer ${i}`, email: `racetest-buyer-${i}@test.local`, password: PASSWORD },
		}),
	),
)
const buyers = await User.find({ email: /^racetest-buyer-/ }).lean()
const buyerTokens = buyers.map(tokenFor)
console.log(`  ${buyerTokens.length} buyers ready`)

const makeSale = async () => {
	const product = await api('/products', {
		method: 'POST',
		token: sellerToken,
		body: { name: 'RaceTest Widget', description: 'race harness', price: 5000, stock: 100000 },
	})
	const productId = product.payload.data._id

	const sale = await api('/flash-sales', {
		method: 'POST',
		token: sellerToken,
		body: {
			productId,
			salePrice: 499,
			totalStock: SALE_STOCK,
			startTime: new Date(Date.now() - 1000).toISOString(),
			endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
			perUserLimit: 1,
		},
	})
	const saleId = sale.payload.data._id
	await api(`/flash-sales/${saleId}/activate`, { method: 'PATCH', token: sellerToken })
	return saleId
}

const stampede = async (route, saleId) => {
	const startedAt = Date.now()
	const results = await Promise.all(
		buyerTokens.map((token, i) =>
			api(route, {
				method: 'POST',
				token,
				body: { flashSaleId: saleId },
				idempotencyKey: `race-${Date.now()}-${i}-${Math.random()}`,
			}).catch((error) => ({ status: 0, payload: { message: error.message } })),
		),
	)

	const elapsedMs = Date.now() - startedAt
	const sold = results.filter((r) => r.status === 201).length
	const rejected = results.length - sold
	const sale = await db.collection('flashsales').findOne({ _id: new mongoose.Types.ObjectId(saleId) })
	const orders = await db.collection('orders').countDocuments({ flashSale: new mongoose.Types.ObjectId(saleId) })

	return {
		sold,
		rejected,
		remainingStock: sale.remainingStock,
		orders,
		errors: results.filter((r) => r.status >= 500).length,
		elapsedMs,
		rps: Math.round((results.length / elapsedMs) * 1000),
	}
}

const report = (label, stock, r) => {
	const oversold = r.orders - stock
	console.log(`\n${label}`)
	console.log(`  sale stock            : ${stock}`)
	console.log(`  concurrent buyers     : ${CONCURRENCY}`)
	console.log(`  HTTP 201 (sold)       : ${r.sold}`)
	console.log(`  rejected              : ${r.rejected}`)
	console.log(`  orders in db          : ${r.orders}`)
	console.log(`  remainingStock        : ${r.remainingStock}`)
	console.log(`  5xx errors            : ${r.errors}`)
	console.log(`  wall clock            : ${r.elapsedMs} ms  (${r.rps} req/s)`)
	console.log(`  >> OVERSOLD BY        : ${oversold > 0 ? oversold : 0} ${oversold > 0 ? '❌' : '✅'}`)
	return oversold
}

console.log(`\nFiring ${CONCURRENCY} concurrent checkouts at a sale with ${SALE_STOCK} stock.`)

const naiveSale = await makeSale()
const naive = await stampede('/flash-sales/checkout/naive', naiveSale)
const naiveOversold = report('NAIVE  (read-then-write)', SALE_STOCK, naive)

const atomicSale = await makeSale()
const atomic = await stampede('/flash-sales/checkout/atomic', atomicSale)
const atomicOversold = report('ATOMIC (mongo findOneAndUpdate guard)', SALE_STOCK, atomic)

const redisSale = await makeSale()
const redisRun = await stampede('/flash-sales/checkout/redis', redisSale)
const redisOversold = report('REDIS  (DECR guard)', SALE_STOCK, redisRun)

const pad = (v, n) => String(v).padStart(n)
console.log('\n' + '='.repeat(62))
console.log('strategy                       oversold    req/s     wall')
console.log('-'.repeat(62))
for (const [label, r, over] of [
	['naive  (read-then-write)', naive, naiveOversold],
	['atomic (mongo findOneAndUpdate)', atomic, atomicOversold],
	['redis  (DECR)', redisRun, redisOversold],
]) {
	console.log(
		`${label.padEnd(31)}${pad(over > 0 ? over : 0, 8)}${pad(r.rps, 9)}${pad(r.elapsedMs + 'ms', 9)}`,
	)
}
console.log('='.repeat(62))
if (atomic.elapsedMs && redisRun.elapsedMs) {
	console.log(`redis vs mongo-atomic: ${(atomic.elapsedMs / redisRun.elapsedMs).toFixed(2)}x faster`)
}

if (!process.env.KEEP_DATA) {
	console.log('\nCleaning up...')
	await cleanup()
}
process.exit(atomicOversold > 0 || redisOversold > 0 ? 1 : 0)
