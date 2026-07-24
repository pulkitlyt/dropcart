import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema(
	{
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
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
			default: 1,
		},
		status: {
			type: String,
			enum: ['active', 'expired', 'cancelled', 'fulfilled'],
			default: 'active',
		},
		reservedAt: {
			type: Date,
			default: Date.now,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: true,
	},
)

reservationSchema.index({ flashSale: 1, user: 1 }, { unique: true })

reservationSchema.virtual('isActive').get(function () {
	return this.status === 'active' && new Date() < this.expiresAt
})

const Reservation = mongoose.model('Reservation', reservationSchema)

export default Reservation
