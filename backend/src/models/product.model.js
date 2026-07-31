import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		compareAtPrice: {
			type: Number,
			min: 0,
		},
		stock: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		images: [
			{
				type: String,
				trim: true,
			},
		],
		category: {
			type: String,
			trim: true,
		},
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		// Denormalised from the reviews collection so listing pages don't need an
		// aggregation per product. Recomputed whenever a review changes.
		ratingAverage: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		ratingCount: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{
		timestamps: true,
	},
)

const Product = mongoose.model('Product', productSchema)

export default Product
