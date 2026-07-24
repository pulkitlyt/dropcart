import mongoose from 'mongoose'

const flashSaleSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		totalStock: {
			type: Number,
			required: true,
			min: 0,
		},
		remainingStock: {
			type: Number,
			required: true,
			min: 0,
		},
		salePrice: {
			type: Number,
			required: true,
			min: 0,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: false,
		},
		version: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{
		timestamps: true,
	},
)

flashSaleSchema.pre('save', function (next) {
	if (!this.isModified('totalStock') && !this.isModified('remainingStock')) {
		return next()
	}

	if (typeof this.remainingStock !== 'number') {
		this.remainingStock = this.totalStock
	}

	if (this.remainingStock > this.totalStock) {
		this.remainingStock = this.totalStock
	}

	next()
})

flashSaleSchema.virtual('isLive').get(function () {
	const now = new Date()
	return this.isActive && now >= this.startTime && now <= this.endTime
})

const FlashSale = mongoose.model('FlashSale', flashSaleSchema)

export default FlashSale
