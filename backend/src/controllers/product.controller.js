import Product from '../models/product.model.js'
import FlashSale from '../models/flashsale.model.js'
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
		// Categories are free-text, so match case-insensitively rather than exactly —
		// otherwise a 'Electronics' link never matches an 'electronics' product.
		query.category = { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
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

// Powers the category nav — derived from live data rather than a hardcoded list.
const getCategories = asyncHandler(async (req, res) => {
	const categories = await Product.distinct('category', { isActive: true, category: { $nin: [null, ''] } })

	// Categories are free-text, so 'Electronics' and 'electronics' both exist in
	// the data. Filtering is case-insensitive, so collapse them into one entry
	// rather than showing the same products under two tiles.
	const deduped = new Map()
	for (const name of categories) {
		const key = name.trim().toLowerCase()
		const existing = deduped.get(key)
		// Prefer the capitalised spelling when both are present.
		if (!existing || (existing[0] === existing[0].toLowerCase() && name[0] !== name[0].toLowerCase())) {
			deduped.set(key, name.trim())
		}
	}

	const result = [...deduped.values()].sort((a, b) => a.localeCompare(b))

	return res.status(200).json(new ApiResponse(200, result, 'Categories fetched successfully'))
})

// Sellers need to see their own drafts too, so this deliberately skips the
// isActive filter that the public listing applies.
const getMyProducts = asyncHandler(async (req, res) => {
	const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 })

	return res.status(200).json(new ApiResponse(200, { products, total: products.length }, 'Products fetched successfully'))
})

const getProductById = asyncHandler(async (req, res) => {
	const { id } = req.params
	const product = await Product.findById(id).lean()

	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	// A shopper arriving from a flash-sale card must not be shown the full price.
	// Attach the live sale (if any) so the page can lead with the sale price.
	const now = new Date()
	const activeFlashSale = await FlashSale.findOne({
		product: id,
		isActive: true,
		startTime: { $lte: now },
		endTime: { $gt: now },
		remainingStock: { $gt: 0 },
	})
		.sort({ salePrice: 1 })
		.lean()

	return res
		.status(200)
		.json(new ApiResponse(200, { ...product, activeFlashSale: activeFlashSale || null }, 'Product fetched successfully'))
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

export {
	createProduct,
	getAllProducts,
	getCategories,
	getMyProducts,
	getProductById,
	updateProduct,
	deleteProduct,
}
