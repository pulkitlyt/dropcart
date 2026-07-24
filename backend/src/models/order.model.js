import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{
		_id: false,
	},
)

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		flashSale: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'FlashSale',
			required: true,
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		idempotencyKey: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
			default: 'pending',
		},
		paymentStatus: {
			type: String,
			enum: ['pending', 'paid', 'failed'],
			default: 'pending',
		},
		items: {
			type: [orderItemSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	},
)

const Order = mongoose.model('Order', orderSchema)

export default Order
