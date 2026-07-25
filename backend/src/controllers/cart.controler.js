import Cart from '../models/cart.model.js'
import Product from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const populateCart = async (cartOrQuery) => {
	const cart = await cartOrQuery
	if (!cart) {
		return cart
	}

	return cart.populate('items.product')
}

const getCart = asyncHandler(async (req, res) => {
	let cart = await populateCart(Cart.findOne({ user: req.user._id }))

	if (!cart) {
		cart = await populateCart(Cart.create({ user: req.user._id, items: [] }))
	}

	return res.status(200).json(new ApiResponse(200, cart, 'Cart fetched successfully'))
})

const addToCart = asyncHandler(async (req, res) => {
	const { productId, quantity = 1 } = req.body

	if (!productId) {
		throw new ApiError(400, 'Product id is required')
	}

	const parsedQuantity = Number(quantity)
	if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
		throw new ApiError(400, 'Quantity must be a positive integer')
	}

	const product = await Product.findById(productId)
	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	if (!product.isActive) {
		throw new ApiError(400, 'Product is not available')
	}

	let cart = await Cart.findOne({ user: req.user._id })
	if (!cart) {
		cart = await Cart.create({ user: req.user._id, items: [] })
	}

	const existingItem = cart.items.find((item) => String(item.product) === String(productId))
	const nextQuantity = (existingItem?.quantity || 0) + parsedQuantity

	if (nextQuantity > product.stock) {
		throw new ApiError(400, 'Requested quantity exceeds available stock')
	}

	if (existingItem) {
		existingItem.quantity = nextQuantity
	} else {
		cart.items.push({ product: productId, quantity: parsedQuantity })
	}

	await cart.save()
	cart = await populateCart(Cart.findById(cart._id))

	return res.status(200).json(new ApiResponse(200, cart, 'Item added to cart successfully'))
})

const updateCartItemQuantity = asyncHandler(async (req, res) => {
	const { itemId } = req.params
	const { quantity } = req.body

	const parsedQuantity = Number(quantity)
	if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
		throw new ApiError(400, 'Quantity must be a positive integer')
	}

	const cart = await Cart.findOne({ user: req.user._id })
	if (!cart) {
		throw new ApiError(404, 'Cart not found')
	}

	const item = cart.items.find((cartItem) => String(cartItem.product) === String(itemId))
	if (!item) {
		throw new ApiError(404, 'Cart item not found')
	}

	const product = await Product.findById(itemId)
	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	if (parsedQuantity > product.stock) {
		throw new ApiError(400, 'Requested quantity exceeds available stock')
	}

	item.quantity = parsedQuantity
	await cart.save()

	const updatedCart = await populateCart(Cart.findById(cart._id))

	return res.status(200).json(new ApiResponse(200, updatedCart, 'Cart item quantity updated successfully'))
})

const removeFromCart = asyncHandler(async (req, res) => {
	const { itemId } = req.params
	const cart = await Cart.findOne({ user: req.user._id })

	if (!cart) {
		throw new ApiError(404, 'Cart not found')
	}

	const nextItems = cart.items.filter((item) => String(item.product) !== String(itemId))

	if (nextItems.length === cart.items.length) {
		throw new ApiError(404, 'Cart item not found')
	}

	cart.items = nextItems
	await cart.save()

	const updatedCart = await populateCart(Cart.findById(cart._id))

	return res.status(200).json(new ApiResponse(200, updatedCart, 'Item removed from cart successfully'))
})

const clearCart = asyncHandler(async (req, res) => {
	const cart = await Cart.findOne({ user: req.user._id })

	if (!cart) {
		throw new ApiError(404, 'Cart not found')
	}

	cart.items = []
	await cart.save()

	const updatedCart = await populateCart(Cart.findById(cart._id))

	return res.status(200).json(new ApiResponse(200, updatedCart, 'Cart cleared successfully'))
})

export { getCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart }
