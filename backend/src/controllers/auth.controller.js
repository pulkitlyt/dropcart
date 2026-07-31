import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// The API is served from the same origin as the site in both environments —
// via the vite proxy locally, and as a serverless function under /api in
// production. That means the cookie can stay SameSite=Strict, which is the
// strongest CSRF posture; a split-domain deploy would have forced 'none'.
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
}

const registerUser = asyncHandler(async (req, res) => {
	const { name, email, password, role } = req.body

	if (!name || !email || !password) {
		throw new ApiError(400, 'Name, email, and password are required')
	}

	const existingUser = await User.findOne({ email })
	if (existingUser) {
		throw new ApiError(409, 'User with email already exists')
	}

	// Never trust the role from the request body: 'admin' can only be granted
	// out-of-band, otherwise anyone could self-register with full privileges.
	const SELF_ASSIGNABLE_ROLES = ['buyer', 'seller']
	const requestedRole = SELF_ASSIGNABLE_ROLES.includes(role) ? role : 'buyer'

	const user = await User.create({
		name,
		email,
		password,
		role: requestedRole,
	})

	const createdUser = await User.findById(user._id).select('-password -refreshToken')

	return res
		.status(201)
		.json(new ApiResponse(201, createdUser, 'User created successfully'))
})

const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		throw new ApiError(400, 'Email and password are required')
	}

	const user = await User.findOne({ email }).select('+password')

	if (!user) {
		throw new ApiError(404, 'User not found')
	}

	const isPasswordValid = await user.isPasswordCorrect(password)
	if (!isPasswordValid) {
		throw new ApiError(401, 'Invalid credentials')
	}

	const accessToken = user.generateAccessToken()
	const refreshToken = user.generateRefreshToken()

	user.refreshToken = refreshToken
	await user.save({ validateBeforeSave: false })

	const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

	const cookieOptions = COOKIE_OPTIONS

	return res
		.status(200)
		.cookie('accessToken', accessToken, cookieOptions)
		.cookie('refreshToken', refreshToken, cookieOptions)
		.json(new ApiResponse(200, loggedInUser, 'User logged in successfully'))
})

const logoutUser = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(req.user._id, {
		$unset: {
			refreshToken: 1,
		},
	})

	const cookieOptions = COOKIE_OPTIONS

	return res
		.status(200)
		.clearCookie('accessToken', cookieOptions)
		.clearCookie('refreshToken', cookieOptions)
		.json(new ApiResponse(200, {}, 'User logged out successfully'))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

	if (!incomingRefreshToken) {
		throw new ApiError(401, 'Unauthorized request')
	}

	let decodedToken
	try {
		decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
	} catch (error) {
		throw new ApiError(401, 'Invalid refresh token')
	}

	const user = await User.findById(decodedToken?._id)

	if (!user || user.refreshToken !== incomingRefreshToken) {
		throw new ApiError(401, 'Refresh token is expired or used')
	}

	const accessToken = user.generateAccessToken()
	const refreshToken = user.generateRefreshToken()

	user.refreshToken = refreshToken
	await user.save({ validateBeforeSave: false })

	const cookieOptions = COOKIE_OPTIONS

	return res
		.status(200)
		.cookie('accessToken', accessToken, cookieOptions)
		.cookie('refreshToken', refreshToken, cookieOptions)
		.json(
			new ApiResponse(
				200,
				{
					accessToken,
					refreshToken,
				},
				'Access token refreshed successfully',
			),
		)
})

const getCurrentUser = asyncHandler(async (req, res) => {
	return res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser }
