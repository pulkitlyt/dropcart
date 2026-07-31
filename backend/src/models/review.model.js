import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
			index: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		title: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		comment: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		// Set at write time by checking the reviewer's order history, so the badge
		// reflects whether they had actually bought it when they reviewed.
		isVerifiedPurchase: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
)

// One review per person per product; a repeat POST updates the existing one.
reviewSchema.index({ product: 1, user: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema)

export default Review
