import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError.js'
import authRouter from './routes/auth.routes.js'
import productRouter from './routes/product.routes.js'
import cartRouter from './routes/cart.routes.js'
import flashSaleRouter from './routes/flashsale.routes.js'
import orderRouter from './routes/order.routes.js'
import eventRouter from './routes/event.routes.js'
import reviewRouter from './routes/review.routes.js'
import uploadRouter from './routes/upload.routes.js'

dotenv.config({ path: './.env', quiet: true })

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean)

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
			return callback(null, false)
		},
		credentials: true,
	}),
)

app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))
app.use(cookieParser())

app.get('/api/v1/health', (req, res) =>
	res.status(200).json({ status: 'ok', uptime: process.uptime() }),
)

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/flash-sales', flashSaleRouter)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/events', eventRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/uploads', uploadRouter)

app.use((err, req, res, next) => {
	console.error(err)

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
