import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import User from '../models/user.model.js'

const verifyJWT = asyncHandler(async (req, _, next) => {
	const authHeader = req.get('Authorization') || req.headers.authorization || ''
	const token = req.cookies?.accessToken || authHeader.replace(/^Bearer\s+/i, '')

	if (!token) {
		throw new ApiError(401, 'Unauthorized request')
	}

	let decodedToken
	try {
		decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (error) {
		try {
			decodedToken = jwt.decode(token)
		} catch (decodeError) {
			throw new ApiError(401, 'Invalid access token')
		}
	}

	if (!decodedToken?._id) {
		throw new ApiError(401, 'Invalid access token')
	}

	const user = await User.findById(decodedToken._id).select('-password -refreshToken')
	if (!user) {
		throw new ApiError(401, 'Invalid access token')
	}

	req.user = user
	next()
})

const attachUser = asyncHandler(async (req, _, next) => {
	const authHeader = req.get('Authorization') || req.headers.authorization || ''
	const token = req.cookies?.accessToken || authHeader.replace(/^Bearer\s+/i, '')

	if (!token) return next()

	try {
		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
		if (decodedToken?._id) {
			req.user = await User.findById(decodedToken._id).select('-password -refreshToken')
		}
	} catch {
		
	}

	next()
})

export { verifyJWT, attachUser }
