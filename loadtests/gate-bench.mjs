/**
 * Micro-benchmark of the *gating primitive* only — no HTTP, no order writes.
 *
 * race-test.mjs measures the whole checkout, where the gate is a small share of
 * the work and network latency to Atlas dominates. This isolates the one
 * operation that actually decides the race, which is the honest comparison
 * between mongo's findOneAndUpdate and redis' DECR.
 */
import mongoose from '../backend/node_modules/mongoose/index.js'
import Redis from '../backend/node_modules/ioredis/built/index.js'
import fs from 'node:fs'

const env = Object.fromEntries(
	fs.readFileSync(new URL('../backend/.env', import.meta.url), 'utf8')
		.split('\n').filter((l) => l.includes('='))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)

const N = Number(process.argv[2]) || 2000
await mongoose.connect(env.MONGODB_URI)
const redis = new Redis(env.REDIS_URL)
const col = mongoose.connection.db.collection('gatebench')

await col.deleteMany({})
const { insertedId } = await col.insertOne({ stock: N + 10 })
await redis.set('gatebench:stock', N + 10)

const time = async (label, fn) => {
	// Warm the connection so the first call doesn't skew the result.
	await fn()
	const t0 = process.hrtime.bigint()
	for (let i = 0; i < N; i += 1) await fn()
	const ms = Number(process.hrtime.bigint() - t0) / 1e6
	console.log(`  ${label.padEnd(34)} ${ms.toFixed(0).padStart(7)} ms   ${(ms / N).toFixed(3)} ms/op   ${Math.round(N / (ms / 1000)).toLocaleString()} ops/s`)
	return ms
}

console.log(`\nSequential gate operations (N=${N}):\n`)
const mongoMs = await time('mongo findOneAndUpdate ($inc)', () =>
	col.findOneAndUpdate({ _id: insertedId, stock: { $gt: 0 } }, { $inc: { stock: -1 } }))
const redisMs = await time('redis DECR', () => redis.decr('gatebench:stock'))

console.log(`\n  redis is ${(mongoMs / redisMs).toFixed(1)}x faster on the gate operation itself`)
console.log(`
  CAVEAT — read this before quoting the number:
  Redis here is on localhost (~0.07ms); Atlas is a remote cluster over the
  internet (~100ms). Most of this ratio is geography, not engine design. A
  co-located mongo would land around 1-2ms/op, i.e. roughly 20-30x, not 1000x.

  The end-to-end figure from race-test.mjs (~1.3x) is the honest one for this
  architecture: the gate is a small share of a checkout that also writes a
  reservation and an order to Atlas, so speeding up the gate alone barely moves
  total throughput. Redis wins decisively only once the gate is the bottleneck.`)

await col.deleteMany({}); await redis.del('gatebench:stock')
await mongoose.connection.close(); redis.disconnect()
