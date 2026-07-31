import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		type: {
			type: String,
			enum: ['movie', 'sports', 'concert', 'theatre'],
			required: true,
		},
		venue: {
			type: String,
			required: true,
			trim: true,
		},
		city: {
			type: String,
			trim: true,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
		},
		posterImage: {
			type: String,
			trim: true,
		},
		organizer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		// Denormalised so the listing page doesn't need a seat aggregation per card.
		totalSeats: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
)

eventSchema.virtual('hasStarted').get(function () {
	return new Date() >= this.startTime
})

const Event = mongoose.model('Event', eventSchema)

export default Event
