/**
 * Vercel serverless entry point for the API.
 *
 * The Express app is reused as-is — this only wraps it so the platform can
 * invoke it as a function instead of a long-running listener. `backend/src/index.js`
 * remains the entry point for running locally.
 */
import app from '../backend/src/app.js'
import connectDB from '../backend/src/db/index.js'

export default async function handler(req, res) {
	try {
		// Cached across warm invocations; see backend/src/db/index.js.
		await connectDB()
	} catch (error) {
		console.error('Database connection failed:', error)
		return res.status(503).json({
			success: false,
			message: 'Database unavailable. Please try again in a moment.',
			errors: [],
		})
	}

	return app(req, res)
}
