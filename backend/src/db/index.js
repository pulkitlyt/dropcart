import mongoose from 'mongoose'

const globalCache = globalThis.__dropcartMongoose ?? { conn: null, promise: null }
globalThis.__dropcartMongoose = globalCache

const connectDB = async () => {
	if (globalCache.conn) return globalCache.conn

	if (!globalCache.promise) {
		const uri = process.env.MONGODB_URI
		if (!uri) throw new Error('MONGODB_URI is not set')

		globalCache.promise = mongoose
			.connect(uri, {
				serverSelectionTimeoutMS: 10000,
				maxPoolSize: 10,
			})
			.then((instance) => {
				console.log(`MongoDB connected: ${instance.connection.host}`)
				return instance
			})
			.catch((error) => {
				globalCache.promise = null
				throw error
			})
	}

	globalCache.conn = await globalCache.promise
	return globalCache.conn
}

export default connectDB
