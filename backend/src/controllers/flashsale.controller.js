import FlashSale from '../models/flashsale.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import Reservation from '../models/reservation.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createFlashSale = asyncHandler(async (req, res) => {
	const { productId, salePrice, totalStock, startTime, endTime, perUserLimit } = req.body

	if (!productId || salePrice === undefined || totalStock === undefined || !startTime || !endTime || perUserLimit === undefined) {
		throw new ApiError(400, 'productId, salePrice, totalStock, startTime, endTime, and perUserLimit are required')
	}

	const product = await Product.findById(productId)
	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	const start = new Date(startTime)
	const end = new Date(endTime)
	const now = new Date()

	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		throw new ApiError(400, 'startTime and endTime must be valid dates')
	}

	if (end <= start) {
		throw new ApiError(400, 'endTime must be after startTime')
	}

	// A sale may start immediately (or backdate); what matters is that it hasn't
	// already finished, otherwise it could never be bought.
	if (end <= now) {
		throw new ApiError(400, 'endTime must be in the future')
	}

	if (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id)) {
		throw new ApiError(403, 'You can only run flash sales on your own products')
	}

	if (Number(totalStock) > product.stock) {
		throw new ApiError(400, 'totalStock cannot exceed product stock')
	}

	const flashSale = await FlashSale.create({
		product: productId,
		salePrice: Number(salePrice),
		totalStock: Number(totalStock),
		remainingStock: Number(totalStock),
		startTime: start,
		endTime: end,
		isActive: false,
	})

	return res.status(201).json(new ApiResponse(201, flashSale, 'Flash sale created successfully'))
})

const getActiveFlashSales = asyncHandler(async (req, res) => {
	const flashSales = await FlashSale.find({ isActive: true })
		.populate({ path: 'product', select: 'name price images category' })
		.sort({ createdAt: -1 })

	return res.status(200).json(new ApiResponse(200, flashSales, 'Active flash sales fetched successfully'))
})

// Sellers need their inactive and finished sales too, not just the live ones.
const getMyFlashSales = asyncHandler(async (req, res) => {
	const myProducts = await Product.find({ seller: req.user._id }).select('_id')
	const query = req.user.role === 'admin' ? {} : { product: { $in: myProducts.map((p) => p._id) } }

	const flashSales = await FlashSale.find(query)
		.populate({ path: 'product', select: 'name price images category' })
		.sort({ createdAt: -1 })

	return res.status(200).json(new ApiResponse(200, flashSales, 'Flash sales fetched successfully'))
})

const getFlashSaleById = asyncHandler(async (req, res) => {
	const { id } = req.params
	const flashSale = await FlashSale.findById(id).populate({ path: 'product', select: 'name price images category' })

	if (!flashSale) {
		throw new ApiError(404, 'Flash sale not found')
	}

	return res.status(200).json(new ApiResponse(200, flashSale, 'Flash sale fetched successfully'))
})

// Admins can act on any sale; sellers only on sales for products they own.
const assertCanManageSale = async (flashSale, user) => {
	if (user.role === 'admin') return

	const product = await Product.findById(flashSale.product).select('seller')
	if (!product || String(product.seller) !== String(user._id)) {
		throw new ApiError(403, 'Forbidden: insufficient permissions')
	}
}

const activateFlashSale = asyncHandler(async (req, res) => {
	const { id } = req.params
	const flashSale = await FlashSale.findById(id)

	if (!flashSale) {
		throw new ApiError(404, 'Flash sale not found')
	}

	await assertCanManageSale(flashSale, req.user)

	flashSale.isActive = true
	await flashSale.save()

	return res.status(200).json(new ApiResponse(200, flashSale, 'Flash sale activated successfully'))
})

const endFlashSale = asyncHandler(async (req, res) => {
	const { id } = req.params
	const flashSale = await FlashSale.findById(id)

	if (!flashSale) {
		throw new ApiError(404, 'Flash sale not found')
	}

	await assertCanManageSale(flashSale, req.user)

	flashSale.isActive = false
	await flashSale.save()

	return res.status(200).json(new ApiResponse(200, flashSale, 'Flash sale ended successfully'))
})

const naiveCheckout = asyncHandler(async (req, res) => {
	// UNSAFE: intentionally broken for demonstration purposes.
	const { flashSaleId } = req.body

	if (!flashSaleId) {
		throw new ApiError(400, 'flashSaleId is required')
	}

	const flashSale = await FlashSale.findById(flashSaleId)
	if (!flashSale) {
		throw new ApiError(404, 'Flash sale not found')
	}

	if (flashSale.remainingStock <= 0) {
		throw new ApiError(400, 'Out of stock')
	}

	flashSale.remainingStock -= 1
	await flashSale.save({ validateBeforeSave: false })

	const order = await Order.create({
		user: req.user._id,
		flashSale: flashSale._id,
		product: flashSale.product,
		quantity: 1,
		totalAmount: flashSale.salePrice,
		idempotencyKey: `${req.user._id}-${flashSale._id}-${Date.now()}`,
		status: 'pending',
	})

	return res.status(201).json(new ApiResponse(201, order, 'Checkout completed successfully'))
})

const atomicCheckout = asyncHandler(async (req, res) => {
	const { flashSaleId } = req.body
	const idempotencyKey = req.headers['x-idempotency-key']

	if (!flashSaleId) {
		throw new ApiError(400, 'flashSaleId is required')
	}

	if (!idempotencyKey) {
		throw new ApiError(400, 'x-idempotency-key header is required')
	}

	const now = new Date()

	// The whole race is decided here: the eligibility checks live *inside* the
	// update filter, so mongo evaluates them and decrements under one lock.
	// Reading first and then writing (see naiveCheckout) is what oversells.
	const updatedSale = await FlashSale.findOneAndUpdate(
		{
			_id: flashSaleId,
			remainingStock: { $gt: 0 },
			isActive: true,
			startTime: { $lte: now },
			endTime: { $gt: now },
		},
		{
			$inc: { remainingStock: -1, version: 1 },
		},
		{ new: true },
	)

	if (!updatedSale) {
		// The filter not matching is ambiguous, so re-read to say why it failed.
		const sale = await FlashSale.findById(flashSaleId)

		if (!sale) throw new ApiError(404, 'Flash sale not found')
		if (!sale.isActive) throw new ApiError(400, 'This sale is not active')
		if (sale.startTime > now) throw new ApiError(400, 'This sale has not started yet')
		if (sale.endTime <= now) throw new ApiError(400, 'This sale has ended')
		throw new ApiError(409, 'Sold out')
	}

	// Past this point we hold one unit of stock. Every failure path below has to
	// hand it back, or the sale leaks stock that nobody can ever buy.
	const releaseStock = () =>
		FlashSale.updateOne({ _id: flashSaleId }, { $inc: { remainingStock: 1, version: 1 } })

	let reservation
	try {
		reservation = await Reservation.create({
			flashSale: flashSaleId,
			product: updatedSale.product,
			user: req.user._id,
			quantity: 1,
			status: 'active',
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		})
	} catch (error) {
		await releaseStock()

		// Duplicate key on the {flashSale, user} unique index — this enforces the
		// one-per-customer limit atomically, without a check-then-insert race.
		if (error?.code === 11000) {
			throw new ApiError(409, 'You have already claimed this flash sale')
		}
		throw error
	}

	let order
	try {
		order = await Order.create({
			user: req.user._id,
			flashSale: flashSaleId,
			product: updatedSale.product,
			quantity: 1,
			totalAmount: updatedSale.salePrice,
			idempotencyKey,
			status: 'confirmed',
			paymentStatus: 'paid',
		})
	} catch (error) {
		await releaseStock()
		await Reservation.deleteOne({ _id: reservation._id })

		// A concurrent retry carrying the same idempotency key won the insert;
		// return that order instead of surfacing a duplicate-key error.
		if (error?.code === 11000) {
			const existingOrder = await Order.findOne({ idempotencyKey, user: req.user._id })
			if (existingOrder) {
				return res.status(200).json(new ApiResponse(200, existingOrder, 'Duplicate request ignored'))
			}
		}
		throw error
	}

	reservation.status = 'fulfilled'
	await reservation.save({ validateBeforeSave: false })

	return res.status(201).json(new ApiResponse(201, order, 'Checkout completed successfully'))
})

export {
	createFlashSale,
	getActiveFlashSales,
	getMyFlashSales,
	getFlashSaleById,
	activateFlashSale,
	endFlashSale,
	naiveCheckout,
	atomicCheckout,
}
