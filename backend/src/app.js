import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { ApiError } from './utils/ApiError.js'

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

app.use((err, req, res, next) => {
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
