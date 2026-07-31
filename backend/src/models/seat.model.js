import mongoose from 'mongoose'

/**
 * One document per seat. That's deliberate: claiming a seat is then a
 * single-document findOneAndUpdate, which mongo guarantees is atomic, so two
 * users racing for the same seat can never both win.
 *
 * Holds expire by *time*, not by a background job — a hold whose holdExpiresAt
 * has passed is treated as available by the claim filter itself. Nothing has to
 * run on a timer for correctness; a sweeper would only be cosmetic.
 */
const seatSchema = new mongoose.Schema(
	{
		event: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
			required: true,
			index: true,
		},
		row: {
			type: String,
			required: true,
		},
		number: {
			type: Number,
			required: true,
			min: 1,
		},
		tier: {
			type: String,
			enum: ['standard', 'premium'],
			default: 'standard',
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ['available', 'held', 'booked'],
			default: 'available',
		},
		heldBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		holdExpiresAt: {
			type: Date,
		},
		bookedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
		},
	},
	{
		timestamps: true,
	},
)

// A seat label must be unique within an event.
seatSchema.index({ event: 1, row: 1, number: 1 }, { unique: true })
// Supports "my current holds" lookups at booking time.
seatSchema.index({ event: 1, heldBy: 1, status: 1 })

seatSchema.virtual('label').get(function () {
	return `${this.row}${this.number}`
})

const Seat = mongoose.model('Seat', seatSchema)

export default Seat
