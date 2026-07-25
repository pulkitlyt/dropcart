import Product from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createProduct = asyncHandler(async (req, res) => {
	const {
		name,
		description,
		price,
		stock,
		category,
		images,
		compareAtPrice,
		isActive,
	} = req.body

	if (!name || !description || price === undefined || stock === undefined) {
		throw new ApiError(400, 'Name, description, price, and stock are required')
	}

	const product = await Product.create({
		name,
		description,
		price,
		stock,
		category,
		images,
		compareAtPrice,
		isActive,
		seller: req.user._id,
	})

	return res.status(201).json(new ApiResponse(201, product, 'Product created successfully'))
})

const getAllProducts = asyncHandler(async (req, res) => {
	const {
		category,
		minPrice,
		maxPrice,
		search,
		page = 1,
		limit = 12,
	} = req.query

	const query = { isActive: true }

	if (category) {
		query.category = category
	}

	if (minPrice !== undefined || maxPrice !== undefined) {
		query.price = {}
		if (minPrice !== undefined) {
			query.price.$gte = Number(minPrice)
		}
		if (maxPrice !== undefined) {
			query.price.$lte = Number(maxPrice)
		}
	}

	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ description: { $regex: search, $options: 'i' } },
		]
	}

	const pageNumber = Math.max(Number(page) || 1, 1)
	const limitNumber = Math.max(Number(limit) || 12, 1)
	const skip = (pageNumber - 1) * limitNumber

	const [products, total] = await Promise.all([
		Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
		Product.countDocuments(query),
	])

	return res.status(200).json(
		new ApiResponse(200, {
			products,
			total,
			page: pageNumber,
			limit: limitNumber,
			totalPages: Math.ceil(total / limitNumber) || 1,
		}, 'Products fetched successfully'),
	)
})

const getProductById = asyncHandler(async (req, res) => {
	const { id } = req.params
	const product = await Product.findById(id)

	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	return res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully'))
})

const updateProduct = asyncHandler(async (req, res) => {
	const { id } = req.params
	const product = await Product.findById(id)

	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	if (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id)) {
		throw new ApiError(403, 'Forbidden: insufficient permissions')
	}

	const updatedProduct = await Product.findByIdAndUpdate(
		id,
		{
			$set: req.body,
		},
		{ new: true },
	)

	return res.status(200).json(new ApiResponse(200, updatedProduct, 'Product updated successfully'))
})

const deleteProduct = asyncHandler(async (req, res) => {
	const { id } = req.params
	const product = await Product.findById(id)

	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	if (req.user.role !== 'admin' && String(product.seller) !== String(req.user._id)) {
		throw new ApiError(403, 'Forbidden: insufficient permissions')
	}

	await Product.findByIdAndDelete(id)

	return res.status(200).json(new ApiResponse(200, {}, 'Product deleted successfully'))
})

export { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct }
