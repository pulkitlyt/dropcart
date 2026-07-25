import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError.js'
import authRouter from './routes/auth.routes.js'
import productRouter from './routes/product.routes.js'
import cartRouter from './routes/cart.routes.js'

dotenv.config({
	path: './.env',
})

const app = express()

app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		credentials: true,
	}),
)

app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))
app.use(cookieParser())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/cart', cartRouter)

app.use((err, req, res, next) => {
    console.error('ERROR STACK:', err.stack) // ADD THIS LINE
	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			errors: err.errors,
		})
	}

	const statusCode = err.statusCode || err.status || 500
	return res.status(statusCode).json({
		success: false,
		message: err.message || 'Internal Server Error',
		errors: err.errors || [],
	})
})

export default app
