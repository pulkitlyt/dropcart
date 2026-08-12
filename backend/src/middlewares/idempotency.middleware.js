import Order from '../models/order.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const idempotencyCheck = asyncHandler(async (req, res, next) => {
	const idempotencyKey = req.headers['x-idempotency-key']

	if (!idempotencyKey) {
		throw new ApiError(400, 'Idempotency key required')
	}

	const existingOrder = await Order.findOne({ idempotencyKey, user: req.user._id })
	if (existingOrder) {
		return res.status(200).json(new ApiResponse(200, existingOrder, 'Duplicate request ignored'))
	}

	next()
})

export { idempotencyCheck }
