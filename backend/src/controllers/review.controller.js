import mongoose from 'mongoose'
import Review from '../models/review.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Recomputes the cached average on the product. Called after every write so the
 * denormalised fields can't drift from the reviews collection.
 */
const syncProductRating = async (productId) => {
	const [summary] = await Review.aggregate([
		{ $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
		{ $group: { _id: '$product', average: { $avg: '$rating' }, count: { $sum: 1 } } },
	])

	await Product.findByIdAndUpdate(productId, {
		ratingAverage: summary ? Math.round(summary.average * 10) / 10 : 0,
		ratingCount: summary?.count || 0,
	})

	return { ratingAverage: summary ? Math.round(summary.average * 10) / 10 : 0, ratingCount: summary?.count || 0 }
}

const hasPurchased = async (userId, productId) => {
	const order = await Order.findOne({
		user: userId,
		$or: [{ 'items.product': productId }, { product: productId }],
	}).select('_id')

	return Boolean(order)
}

const getProductReviews = asyncHandler(async (req, res) => {
	const { id } = req.params

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid product id')
	}

	const reviews = await Review.find({ product: id })
		.populate({ path: 'user', select: 'name' })
		.sort({ createdAt: -1 })
		.lean()

	// Histogram powers the 5→1 star breakdown on the product page.
	const distribution = [5, 4, 3, 2, 1].map((star) => ({
		star,
		count: reviews.filter((review) => review.rating === star).length,
	}))

	const product = await Product.findById(id).select('ratingAverage ratingCount')

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				reviews,
				distribution,
				ratingAverage: product?.ratingAverage || 0,
				ratingCount: product?.ratingCount || 0,
				myReview: reviews.find((review) => String(review.user?._id) === String(req.user?._id)) || null,
			},
			'Reviews fetched successfully',
		),
	)
})

// Upsert: posting again replaces your own review rather than erroring on the
// unique index, which is what a user editing their rating expects.
const upsertReview = asyncHandler(async (req, res) => {
	const { id } = req.params
	const { rating, title, comment } = req.body

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid product id')
	}

	const parsedRating = Number(rating)
	if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
		throw new ApiError(400, 'Rating must be a whole number from 1 to 5')
	}

	const product = await Product.findById(id)
	if (!product) {
		throw new ApiError(404, 'Product not found')
	}

	const review = await Review.findOneAndUpdate(
		{ product: id, user: req.user._id },
		{
			$set: {
				rating: parsedRating,
				title: title?.trim(),
				comment: comment?.trim(),
				isVerifiedPurchase: await hasPurchased(req.user._id, id),
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).populate({ path: 'user', select: 'name' })

	const summary = await syncProductRating(id)

	return res.status(201).json(new ApiResponse(201, { review, ...summary }, 'Review saved successfully'))
})

const deleteReview = asyncHandler(async (req, res) => {
	const { id } = req.params

	const review = await Review.findById(id)
	if (!review) {
		throw new ApiError(404, 'Review not found')
	}

	if (req.user.role !== 'admin' && String(review.user) !== String(req.user._id)) {
		throw new ApiError(403, 'You can only delete your own review')
	}

	await Review.findByIdAndDelete(id)
	const summary = await syncProductRating(review.product)

	return res.status(200).json(new ApiResponse(200, summary, 'Review deleted successfully'))
})

export { getProductReviews, upsertReview, deleteReview, syncProductRating }
