import mongoose from 'mongoose'
import Event from '../models/event.model.js'
import Seat from '../models/seat.model.js'
import Order from '../models/order.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parsePayment } from '../utils/checkoutDetails.js'

// How long a seat stays reserved for a user before it returns to the pool.
const HOLD_DURATION_MS = 5 * 60 * 1000
const MAX_SEATS_PER_BOOKING = 10

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const createEvent = asyncHandler(async (req, res) => {
	const {
		title,
		description,
		type,
		venue,
		city,
		startTime,
		endTime,
		posterImage,
		rows = 8,
		seatsPerRow = 12,
		price,
		premiumRows = 0,
		premiumPrice,
	} = req.body

	if (!title || !type || !venue || !startTime || price === undefined) {
		throw new ApiError(400, 'title, type, venue, startTime, and price are required')
	}

	const start = new Date(startTime)
	if (Number.isNaN(start.getTime())) {
		throw new ApiError(400, 'startTime must be a valid date')
	}

	const rowCount = Number(rows)
	const perRow = Number(seatsPerRow)

	if (!Number.isInteger(rowCount) || rowCount < 1 || rowCount > 26) {
		throw new ApiError(400, 'rows must be between 1 and 26')
	}

	if (!Number.isInteger(perRow) || perRow < 1 || perRow > 40) {
		throw new ApiError(400, 'seatsPerRow must be between 1 and 40')
	}

	const event = await Event.create({
		title,
		description,
		type,
		venue,
		city,
		startTime: start,
		endTime: endTime ? new Date(endTime) : undefined,
		posterImage,
		organizer: req.user._id,
		totalSeats: rowCount * perRow,
	})

	// Front rows are the premium ones, matching how venues are usually priced.
	const premiumCount = Math.min(Number(premiumRows) || 0, rowCount)
	const seats = []

	for (let r = 0; r < rowCount; r += 1) {
		const isPremium = r < premiumCount
		for (let n = 1; n <= perRow; n += 1) {
			seats.push({
				event: event._id,
				row: ROW_LABELS[r],
				number: n,
				tier: isPremium ? 'premium' : 'standard',
				price: isPremium ? Number(premiumPrice ?? price) : Number(price),
				status: 'available',
			})
		}
	}

	await Seat.insertMany(seats)

	return res.status(201).json(new ApiResponse(201, event, 'Event created successfully'))
})

const getEvents = asyncHandler(async (req, res) => {
	const { type, city, search } = req.query
	const query = { isActive: true }

	if (type) query.type = type
	if (city) query.city = { $regex: `^${city}$`, $options: 'i' }
	if (search) query.title = { $regex: search, $options: 'i' }

	const events = await Event.find(query).sort({ startTime: 1 }).lean()

	// Availability counts for the cards. Expired holds count as available.
	const now = new Date()
	const withAvailability = await Promise.all(
		events.map(async (event) => ({
			...event,
			availableSeats: await Seat.countDocuments({
				event: event._id,
				status: { $ne: 'booked' },
				$or: [{ status: 'available' }, { holdExpiresAt: { $lte: now } }],
			}),
		})),
	)

	return res.status(200).json(new ApiResponse(200, withAvailability, 'Events fetched successfully'))
})

const getMyEvents = asyncHandler(async (req, res) => {
	const query = req.user.role === 'admin' ? {} : { organizer: req.user._id }
	const events = await Event.find(query).sort({ createdAt: -1 })

	return res.status(200).json(new ApiResponse(200, events, 'Events fetched successfully'))
})

const getEventById = asyncHandler(async (req, res) => {
	const { id } = req.params

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid event id')
	}

	const event = await Event.findById(id).populate({ path: 'organizer', select: 'name' })

	if (!event) {
		throw new ApiError(404, 'Event not found')
	}

	return res.status(200).json(new ApiResponse(200, event, 'Event fetched successfully'))
})

// The seat map. Holds belonging to other users are reported as 'held' but an
// expired hold is reported as 'available', matching what a claim would do.
const getSeats = asyncHandler(async (req, res) => {
	const { id } = req.params

	if (!mongoose.isValidObjectId(id)) {
		throw new ApiError(400, 'Invalid event id')
	}

	const seats = await Seat.find({ event: id }).sort({ row: 1, number: 1 }).lean()
	const now = new Date()
	const viewerId = req.user?._id ? String(req.user._id) : null

	const mapped = seats.map((seat) => {
		const holdActive = seat.holdExpiresAt && seat.holdExpiresAt > now
		let status = seat.status

		if (seat.status === 'held' && !holdActive) status = 'available'

		return {
			_id: seat._id,
			row: seat.row,
			number: seat.number,
			label: `${seat.row}${seat.number}`,
			tier: seat.tier,
			price: seat.price,
			status,
			// Lets the client render the seats it is currently holding differently.
			mine: Boolean(viewerId && holdActive && String(seat.heldBy) === viewerId) ||
				Boolean(viewerId && seat.status === 'booked' && String(seat.bookedBy) === viewerId),
			holdExpiresAt: holdActive ? seat.holdExpiresAt : null,
		}
	})

	return res.status(200).json(new ApiResponse(200, mapped, 'Seats fetched successfully'))
})

const holdSeats = asyncHandler(async (req, res) => {
	const { id } = req.params
	const { seatIds } = req.body

	if (!Array.isArray(seatIds) || seatIds.length === 0) {
		throw new ApiError(400, 'seatIds must be a non-empty array')
	}

	if (seatIds.length > MAX_SEATS_PER_BOOKING) {
		throw new ApiError(400, `You can hold at most ${MAX_SEATS_PER_BOOKING} seats at a time`)
	}

	const event = await Event.findById(id)
	if (!event) throw new ApiError(404, 'Event not found')
	if (!event.isActive) throw new ApiError(400, 'This event is not on sale')
	if (event.startTime <= new Date()) throw new ApiError(400, 'This event has already started')

	const now = new Date()
	const holdExpiresAt = new Date(now.getTime() + HOLD_DURATION_MS)
	const claimed = []

	// Release anything we grabbed before hitting a seat somebody else owns —
	// a partial hold would silently strand seats the user never gets to book.
	const releaseClaimed = () =>
		Seat.updateMany(
			{ _id: { $in: claimed.map((seat) => seat._id) }, heldBy: req.user._id },
			{ $set: { status: 'available' }, $unset: { heldBy: 1, holdExpiresAt: 1 } },
		)

	for (const seatId of seatIds) {
		if (!mongoose.isValidObjectId(seatId)) {
			await releaseClaimed()
			throw new ApiError(400, 'Invalid seat id')
		}

		// The whole race lives in this filter. A seat is claimable when it is
		// free, already ours, or under a hold that has lapsed — evaluated and
		// written in one atomic step, so simultaneous claims cannot both match.
		const seat = await Seat.findOneAndUpdate(
			{
				_id: seatId,
				event: id,
				status: { $ne: 'booked' },
				$or: [
					{ status: 'available' },
					{ heldBy: req.user._id },
					{ holdExpiresAt: { $lte: now } },
				],
			},
			{
				$set: {
					status: 'held',
					heldBy: req.user._id,
					holdExpiresAt,
				},
			},
			{ new: true },
		)

		if (!seat) {
			await releaseClaimed()
			const taken = await Seat.findById(seatId).select('row number')
			throw new ApiError(
				409,
				taken ? `Seat ${taken.row}${taken.number} was just taken` : 'Seat not found',
			)
		}

		claimed.push(seat)
	}

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				seats: claimed.map((seat) => ({
					_id: seat._id,
					label: `${seat.row}${seat.number}`,
					tier: seat.tier,
					price: seat.price,
				})),
				holdExpiresAt,
				holdSeconds: Math.round(HOLD_DURATION_MS / 1000),
				totalAmount: claimed.reduce((sum, seat) => sum + seat.price, 0),
			},
			'Seats held successfully',
		),
	)
})

const releaseSeats = asyncHandler(async (req, res) => {
	const { id } = req.params

	const result = await Seat.updateMany(
		{ event: id, heldBy: req.user._id, status: 'held' },
		{ $set: { status: 'available' }, $unset: { heldBy: 1, holdExpiresAt: 1 } },
	)

	return res
		.status(200)
		.json(new ApiResponse(200, { released: result.modifiedCount }, 'Seats released successfully'))
})

const bookSeats = asyncHandler(async (req, res) => {
	const { id } = req.params
	const idempotencyKey = req.headers['x-idempotency-key']

	if (!idempotencyKey) {
		throw new ApiError(400, 'x-idempotency-key header is required')
	}

	const event = await Event.findById(id)
	if (!event) throw new ApiError(404, 'Event not found')

	// Tickets are digital, so payment is collected but no shipping address.
	const payment = parsePayment(req.body?.payment)

	// Check this before the hold lookup: a successful booking consumes the hold,
	// so a retried request would otherwise be told its hold had expired.
	const priorOrder = await Order.findOne({ idempotencyKey, user: req.user._id })
	if (priorOrder) {
		return res.status(200).json(new ApiResponse(200, priorOrder, 'Duplicate request ignored'))
	}

	const now = new Date()
	const held = await Seat.find({
		event: id,
		heldBy: req.user._id,
		status: 'held',
		holdExpiresAt: { $gt: now },
	})

	if (held.length === 0) {
		throw new ApiError(409, 'Your seat hold has expired. Please pick your seats again.')
	}

	const totalAmount = held.reduce((sum, seat) => sum + seat.price, 0)

	let order
	try {
		order = await Order.create({
			user: req.user._id,
			type: 'ticket',
			event: event._id,
			seats: held.map((seat) => ({
				seat: seat._id,
				label: `${seat.row}${seat.number}`,
				tier: seat.tier,
				price: seat.price,
			})),
			totalAmount,
			payment,
			idempotencyKey,
			status: 'confirmed',
			paymentStatus: 'paid',
		})
	} catch (error) {
		if (error?.code === 11000) {
			const existingOrder = await Order.findOne({ idempotencyKey, user: req.user._id })
			if (existingOrder) {
				return res.status(200).json(new ApiResponse(200, existingOrder, 'Duplicate request ignored'))
			}
		}
		throw error
	}

	// Convert each hold into a booking. The filter re-checks ownership and
	// expiry so a hold that lapsed between the read above and here can't book.
	const confirmed = []
	for (const seat of held) {
		const booked = await Seat.findOneAndUpdate(
			{ _id: seat._id, heldBy: req.user._id, status: 'held', holdExpiresAt: { $gt: new Date() } },
			{
				$set: { status: 'booked', bookedBy: req.user._id, order: order._id },
				$unset: { heldBy: 1, holdExpiresAt: 1 },
			},
			{ new: true },
		)
		if (booked) confirmed.push(booked)
	}

	if (confirmed.length === 0) {
		await Order.deleteOne({ _id: order._id })
		throw new ApiError(409, 'Your seat hold expired during checkout. Please pick your seats again.')
	}

	// A hold lapsed mid-checkout and someone else took it: charge only for what
	// was actually secured rather than failing the whole booking.
	if (confirmed.length !== held.length) {
		const securedSeats = confirmed.map((seat) => ({
			seat: seat._id,
			label: `${seat.row}${seat.number}`,
			tier: seat.tier,
			price: seat.price,
		}))

		order.seats = securedSeats
		order.totalAmount = securedSeats.reduce((sum, seat) => sum + seat.price, 0)
		await order.save()
	}

	const populated = await Order.findById(order._id).populate({ path: 'event', select: 'title venue startTime type posterImage' })

	return res.status(201).json(new ApiResponse(201, populated, 'Tickets booked successfully'))
})

export { createEvent, getEvents, getMyEvents, getEventById, getSeats, holdSeats, releaseSeats, bookSeats }
