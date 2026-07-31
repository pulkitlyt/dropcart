import mongoose from 'mongoose'

/**
 * Serverless-safe connection.
 *
 * Every cold start runs module code again, so a naive `mongoose.connect()` would
 * open a fresh pool per invocation and exhaust the Atlas connection limit under
 * any real traffic. Vercel keeps the module scope alive between warm
 * invocations, so caching the promise on globalThis lets them share one pool.
 */
const globalCache = globalThis.__dropcartMongoose ?? { conn: null, promise: null }
globalThis.__dropcartMongoose = globalCache

const connectDB = async () => {
	if (globalCache.conn) return globalCache.conn

	if (!globalCache.promise) {
		const uri = process.env.MONGODB_URI
		if (!uri) throw new Error('MONGODB_URI is not set')

		globalCache.promise = mongoose
			.connect(uri, {
				// Fail fast rather than hanging until the platform's request timeout.
				serverSelectionTimeoutMS: 10000,
				maxPoolSize: 10,
			})
			.then((instance) => {
				console.log(`MongoDB connected: ${instance.connection.host}`)
				return instance
			})
			.catch((error) => {
				// Clear the cached promise so the next invocation retries instead of
				// replaying a rejected promise forever.
				globalCache.promise = null
				throw error
			})
	}

	globalCache.conn = await globalCache.promise
	return globalCache.conn
}

export default connectDB
