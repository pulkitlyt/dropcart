import mongoose from 'mongoose'
import Cart from '../models/cart.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import Event from '../models/event.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseAddress, parsePayment } from '../utils/checkoutDetails.js'

// Regular cart checkout. Unlike a flash sale there's no fixed pool to race for,
// but stock is still shared, so each decrement is conditional on availability
// and anything already claimed is rolled back on failure.
const placeOrderFromCart = asyncHandler(async (req, res) => {
	const idempotencyKey = req.headers['x-idempotency-key']

	if (!idempotencyKey) {
		throw new ApiError(400, 'x-idempotency-key header is required')
	}

	const shippingAddress = parseAddress(req.body?.shippingAddress)
	const payment = parsePayment(req.body?.payment)

	const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')

	if (!cart || cart.items.length === 0) {
		throw new ApiError(400, 'Your cart is empty')
	}

	const items = []
	let totalAmount = 0

	for (const item of cart.items) {
		if (!item.product) {
			throw new ApiError(400, 'A product in your cart no longer exists')
		}

		if (!item.product.isActive) {
			throw new ApiError(400, `${item.product.name} is no longer available`)
		}

		items.push({ product: item.product._id, quantity: item.quantity, price: item.product.price })
		totalAmount += item.product.price * item.quantity
	}

	// Claim stock item by item, remembering what we took so we can undo it.
	const claimed = []

	const releaseClaimed = () =>
		Promise.all(
			claimed.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })),
		)

	for (const item of items) {
		const updated = await Product.findOneAndUpdate(
			{ _id: item.product, stock: { $gte: item.quantity } },
			{ $inc: { stock: -item.quantity } },
			{ new: true },
		)

		if (!updated) {
			await releaseClaimed()
			const product = await Product.findById(item.product).select('name')
			throw new ApiError(409, `Not enough stock for ${product?.name || 'an item in your cart'}`)
		}

		claimed.push(item)
	}

	let order
	try {
		order = await Order.create({
			user: req.user._id,
			type: 'cart',
			items,
			totalAmount,
			shippingAddress,
			payment,
			idempotencyKey,
			status: 'confirmed',
			paymentStatus: 'paid',
		})
	} catch (error) {
		await releaseClaimed()

		if (error?.code === 11000) {
			const existingOrder = await Order.findOne({ idempotencyKey, user: req.user._id })
			if (existingOrder) {
				return res.status(200).json(new ApiResponse(200, existingOrder, 'Duplicate request ignored'))
			}
		}
		throw error
	}

	cart.items = []
	await cart.save()

	const populatedOrder = await Order.findById(order._id).populate({
		path: 'items.product',
		select: 'name price images category',
	})

	return res.status(201).json(new ApiResponse(201, populatedOrder, 'Order placed successfully'))
})

const getMyOrders = asyncHandler(async (req, res) => {
	const orders = await Order.find({ user: req.user._id })
		.populate({ path: 'items.product', select: 'name price images category' })
		.populate({ path: 'product', select: 'name price images category' })
		.populate({ path: 'event', select: 'title venue city startTime type posterImage' })
		.sort({ createdAt: -1 })

	return res.status(200).json(new ApiResponse(200, orders, 'Orders fetched successfully'))
})

const getOrderById = asyncHandler(async (req, res) => {
	const { id } = req.params

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid order id')
	}

	const order = await Order.findById(id)
		.populate({ path: 'items.product', select: 'name price images category' })
		.populate({ path: 'product', select: 'name price images category' })
		.populate({ path: 'event', select: 'title venue city startTime type posterImage' })

	if (!order) {
		throw new ApiError(404, 'Order not found')
	}

	if (req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
		throw new ApiError(403, 'Forbidden: insufficient permissions')
	}

	return res.status(200).json(new ApiResponse(200, order, 'Order fetched successfully'))
})

// Everything a seller is allowed to see: their products (via cart lines or a
// flash sale) and their events.
const sellerScope = async (user) => {
	const [products, events] = await Promise.all([
		Product.find({ seller: user._id }).select('_id'),
		Event.find({ organizer: user._id }).select('_id'),
	])

	return {
		productIds: products.map((p) => p._id),
		eventIds: events.map((e) => e._id),
	}
}

const getSellerOrders = asyncHandler(async (req, res) => {
	const { productIds, eventIds } = await sellerScope(req.user)

	const query =
		req.user.role === 'admin'
			? {}
			: {
					$or: [
						{ 'items.product': { $in: productIds } },
						{ product: { $in: productIds } },
						{ event: { $in: eventIds } },
					],
				}

	const orders = await Order.find(query)
		.populate({ path: 'items.product', select: 'name price images category seller' })
		.populate({ path: 'product', select: 'name price images category seller' })
		.populate({ path: 'event', select: 'title venue city startTime type posterImage organizer' })
		.populate({ path: 'user', select: 'name email' })
		.sort({ createdAt: -1 })
		.lean()

	const owns = (id) => productIds.some((productId) => String(productId) === String(id))
	const isAdmin = req.user.role === 'admin'

	const scoped = orders.map((order) => {
		// An order can span several sellers, so report only this seller's lines
		// and the revenue attributable to them — not the order total.
		const mineItems = (order.items || []).filter((item) => isAdmin || owns(item.product?._id))
		const ownsSingleProduct = order.product && (isAdmin || owns(order.product._id))
		const ownsEvent = order.event && (isAdmin || eventIds.some((id) => String(id) === String(order.event.organizer)))

		let sellerTotal = mineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
		if (ownsSingleProduct) sellerTotal += order.totalAmount
		if (ownsEvent) sellerTotal += order.totalAmount

		// Only safe to let this seller move the status when no one else's goods
		// are in the same order, otherwise they'd be fulfilling on another's behalf.
		const foreignItems = (order.items || []).filter((item) => !owns(item.product?._id)).length
		const canUpdateStatus = isAdmin || (foreignItems === 0 && !(order.product && !ownsSingleProduct))

		return {
			...order,
			sellerItems: mineItems,
			sellerTotal,
			isTicketOrder: Boolean(order.event),
			isFlashSaleOrder: Boolean(order.flashSale),
			canUpdateStatus,
		}
	})

	return res.status(200).json(new ApiResponse(200, scoped, 'Seller orders fetched successfully'))
})

// Fulfilment moves forward only; cancelling is allowed until it ships.
const ALLOWED_TRANSITIONS = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['shipped', 'cancelled'],
	shipped: ['delivered'],
	delivered: [],
	cancelled: [],
}

const updateOrderStatus = asyncHandler(async (req, res) => {
	const { id } = req.params
	const { status } = req.body

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid order id')
	}

	const order = await Order.findById(id)
	if (!order) {
		throw new ApiError(404, 'Order not found')
	}

	if (req.user.role !== 'admin') {
		const { productIds, eventIds } = await sellerScope(req.user)
		const ids = productIds.map(String)

		const lineProductIds = (order.items || []).map((item) => String(item.product))
		const ownsEveryLine = lineProductIds.length > 0 && lineProductIds.every((pid) => ids.includes(pid))
		const ownsSingleProduct = order.product && ids.includes(String(order.product))
		const ownsEvent = order.event && eventIds.some((eid) => String(eid) === String(order.event))

		if (!ownsEveryLine && !ownsSingleProduct && !ownsEvent) {
			throw new ApiError(403, 'This order contains items you do not sell')
		}
	}

	const allowed = ALLOWED_TRANSITIONS[order.status] || []
	if (!allowed.includes(status)) {
		throw new ApiError(400, `Cannot move an order from ${order.status} to ${status}`)
	}

	order.status = status
	await order.save()

	return res.status(200).json(new ApiResponse(200, order, 'Order status updated successfully'))
})

export { placeOrderFromCart, getMyOrders, getOrderById, getSellerOrders, updateOrderStatus }
