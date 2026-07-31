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
		// Which checkout produced this order — the three paths populate different
		// fields, so this saves consumers from guessing by inspecting them.
		type: {
			type: String,
			enum: ['cart', 'flash-sale', 'ticket'],
			default: 'cart',
		},
		// Only set for ticket orders.
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
		},
		seats: [
			{
				_id: false,
				seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
				label: String,
				tier: String,
				price: Number,
			},
		],
		// Only set for flash-sale checkouts; regular cart orders leave these empty
		// and carry their contents in `items` instead.
		flashSale: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'FlashSale',
		},
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
		},
		quantity: {
			type: Number,
			min: 1,
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		shippingAddress: {
			fullName: String,
			phone: String,
			line1: String,
			line2: String,
			city: String,
			state: String,
			pincode: String,
			country: { type: String, default: 'India' },
		},
		// Deliberately stores only what's safe to keep. The full card number and
		// CVV are validated in the browser and never sent to this server, so
		// there is nothing here to leak. This is a demo — no real processing.
		payment: {
			method: { type: String, enum: ['card', 'upi', 'cod'], default: 'card' },
			cardBrand: String,
			last4: String,
			expiryMonth: String,
			expiryYear: String,
			nameOnCard: String,
			upiId: String,
		},
		idempotencyKey: {
			type: String,
			required: true,
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

// Scoped to the user, not global: one client's key must never resolve to
// another client's order, and two users may legitimately pick the same string.
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true })

const Order = mongoose.model('Order', orderSchema)

export default Order
