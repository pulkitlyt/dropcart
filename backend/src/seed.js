
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from './db/index.js'
import User from './models/user.model.js'
import Product from './models/product.model.js'
import FlashSale from './models/flashsale.model.js'
import Event from './models/event.model.js'
import Seat from './models/seat.model.js'
import Review from './models/review.model.js'
import { syncProductRating } from './controllers/review.controller.js'

dotenv.config({ path: './.env' })

const SEED_EMAIL = 'demo-seller@dropcart.local'
const SEED_PASSWORD = 'demoseller123'
const img = (id) => `https://images.unsplash.com/${id}?w=900&q=80`

const PRODUCTS = [
	['Premium Wireless Headphones', 'Active noise cancelling with 40 hours of battery and USB-C fast charge.', 12499, 24999, 60, 'Electronics', 'photo-1505740420928-5e560c06d30e'],
	['Slim Wireless Keyboard', 'Low-profile scissor switches with a month of battery per charge.', 10999, 13999, 40, 'Electronics', 'photo-1587829741301-dc798b83add3'],
	['Smart Watch Pro', 'AMOLED always-on display, dual-band GPS and a 7 day battery.', 16999, 33999, 35, 'Electronics', 'photo-1523275335684-37898b6baf30'],
	['Wireless Gaming Mouse', '26K DPI sensor, 70 hour battery and an 8K polling rate.', 5899, 7499, 55, 'Electronics', 'photo-1527814050087-3793815479db'],
	['Instant Film Camera', 'Point, shoot and print. Ships with two film packs.', 45999, 74999, 15, 'Electronics', 'photo-1526170375885-4d8ecf77b99f'],
	['Classic Court Sneakers', 'Full-grain leather uppers on a cushioned cupsole.', 6799, 8999, 80, 'Fashion', 'photo-1549298916-b41d501d3772'],
	['Designer Leather Jacket', 'Hand-finished lambskin with a satin lining.', 20999, 41999, 20, 'Fashion', 'photo-1551028719-00167b16eac5'],
	['Denim Jacket', 'Washed indigo, relaxed fit, triple-stitched seams.', 7599, 9499, 45, 'Fashion', 'photo-1576995853123-5a10305d93c0'],
	['Everyday Canvas Backpack', 'Water-resistant canvas with a padded 16 inch laptop sleeve.', 9499, 12999, 30, 'Fashion', 'photo-1553062407-98eeb64c6a62'],
	['Atomic Habits', 'James Clear. Tiny changes, remarkable results.', 1399, 1899, 120, 'Books', 'photo-1544947950-fa07a98d237f'],
	['Mystery Thriller Novel', 'A slow-burn locked-room mystery with a genuinely earned twist.', 1249, 1599, 90, 'Books', 'photo-1543002588-bfa74002ed7e'],
	['The Design Anthology', 'A hardback survey of a century of industrial design.', 2799, 3499, 40, 'Books', 'photo-1544716278-ca5e3f4abd8c'],
	['Stainless Steel Cookware Set', 'Five-ply base, induction ready, oven safe to 260°C.', 16999, 21999, 25, 'Home & Kitchen', 'photo-1556909114-f6e7ad7d3136'],
	['Pour-Over Coffee Carafe', 'Borosilicate carafe with a reusable stainless filter.', 12699, 15999, 30, 'Home & Kitchen', 'photo-1521302080334-4bebac2763a6'],
	['Ceramic Dinner Set', 'Twelve-piece reactive glaze set. Dishwasher and microwave safe.', 5499, 7499, 35, 'Home & Kitchen', 'photo-1603199506016-b9a594b593c0'],
	['Luxury Skincare Set', 'Serum, moisturiser and cleanser for a full evening routine.', 7599, 9999, 50, 'Beauty', 'photo-1571781926291-c477ebfd024b'],
	['Organic Face Serum', 'Vitamin C and hyaluronic acid in a fragrance-free base.', 3899, 4999, 70, 'Beauty', 'photo-1620916566398-39f1143ab7be'],
	['Botanical Perfume', 'Bergamot, cedar and vetiver. Long-wear eau de parfum.', 6299, 8499, 40, 'Beauty', 'photo-1592945403244-b3fbafd7f539'],
	['Yoga Mat Pro', 'Six millimetre natural rubber with an alignment print.', 4199, 5499, 65, 'Sports', 'photo-1601925260368-ae2f83cf8b7f'],
	['Running Shoes Elite', 'Carbon plate, 38mm stack, built for race day.', 10199, 13999, 40, 'Sports', 'photo-1542291026-7eec264c27ff'],
	['Adjustable Dumbbell Set', 'Five to 32.5kg per hand with a quick-select dial.', 18999, 24999, 18, 'Sports', 'photo-1534438327276-14e5300c3a48'],
	['Retro Handheld Console', 'Plug-and-play with 200 classics and a backlit colour screen.', 8999, 11999, 28, 'Toys', 'photo-1531525645387-7f14be1bdbbd'],
	['Classic Brick Building Set', 'Thousand-piece set of compatible bricks in fifteen colours.', 2499, 3299, 60, 'Toys', 'photo-1587654780291-39c9404d746b'],
	['Cold Pressed Olive Oil', 'Single-estate extra virgin, harvested and pressed same day.', 1899, 2399, 100, 'Groceries', 'photo-1474979266404-7eaacbcd87c5'],
	['Artisan Coffee Beans', 'Single-origin Ethiopian, roasted weekly in small batches.', 1299, 1699, 150, 'Groceries', 'photo-1517668808822-9ebb02f2a0e6'],
]

const EVENTS = [
	['Interstellar — IMAX Re-release', 'movie', 'PVR ICON', 'Mumbai', 30, 7, 14, 450, 2, 750, 'photo-1489599849927-2ee91cede3ba'],
	['The Midnight Symphony', 'concert', 'NSCI Dome', 'Mumbai', 54, 8, 16, 1500, 2, 3500, 'photo-1470229722913-7c0e2dbbafd3'],
	['City FC vs Rovers United', 'sports', 'Salt Lake Stadium', 'Kolkata', 78, 10, 18, 800, 3, 2000, 'photo-1522778119026-d647f0596c20'],
	['A Midsummer Night’s Dream', 'theatre', 'Prithvi Theatre', 'Mumbai', 102, 6, 12, 600, 1, 1200, 'photo-1503095396549-807759245b35'],
	['Indie Nights: Live Sessions', 'concert', 'Phoenix Arena', 'Bengaluru', 126, 6, 14, 900, 2, 1800, 'photo-1459749411175-04bf5292ceea'],
]

const FLASH_SALES = [
	['Premium Wireless Headphones', 6249, 25, 6],
	['Smart Watch Pro', 8499, 15, 4],
	['Designer Leather Jacket', 10499, 10, 8],
	['Running Shoes Elite', 5099, 20, 5],
]

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const REVIEWERS = [
	['Ananya Rao', 'ananya.demo@dropcart.local'],
	['Rohit Menon', 'rohit.demo@dropcart.local'],
	['Priya Nair', 'priya.demo@dropcart.local'],
	['Karan Shah', 'karan.demo@dropcart.local'],
	['Meera Iyer', 'meera.demo@dropcart.local'],
]

const REVIEW_TEXT = [
	[5, 'Exactly as described', 'Arrived two days early and the build quality is better than I expected for the price.'],
	[4, 'Very good, minor niggle', 'Really happy with it overall. Packaging could be less wasteful.'],
	[5, 'Would buy again', 'Second one I have ordered. No complaints at all.'],
	[3, 'Fine, not amazing', 'Does the job but feels a bit lighter than the photos suggest.'],
	[4, 'Good value', 'Solid for what it costs. Delivery was quick too.'],
	[5, 'Excellent', 'Genuinely impressed. Recommended it to two friends already.'],
	[2, 'Not for me', 'Quality is okay but it was smaller than I pictured. Returning.'],
]

const run = async () => {
	await connectDB()

	let seller = await User.findOne({ email: SEED_EMAIL })

	if (process.argv.includes('--reset') && seller) {
		const products = await Product.find({ seller: seller._id }).select('_id')
		const productIds = products.map((p) => p._id)
		const events = await Event.find({ organizer: seller._id }).select('_id')
		const eventIds = events.map((e) => e._id)

		await Review.deleteMany({ product: { $in: productIds } })
		await User.deleteMany({ email: /@dropcart\.local$/, role: 'buyer' })
		await FlashSale.deleteMany({ product: { $in: productIds } })
		await Product.deleteMany({ _id: { $in: productIds } })
		await Seat.deleteMany({ event: { $in: eventIds } })
		await Event.deleteMany({ _id: { $in: eventIds } })
		console.log(`Reset: removed ${productIds.length} products and ${eventIds.length} events.`)
	}

	if (!seller) {
		seller = await User.create({
			name: 'DropCart Demo Store',
			email: SEED_EMAIL,
			password: SEED_PASSWORD,
			role: 'seller',
		})
		console.log(`Created seller ${SEED_EMAIL} (password: ${SEED_PASSWORD})`)
	}

	let createdProducts = 0
	for (const [name, description, price, compareAtPrice, stock, category, photo] of PRODUCTS) {
		if (await Product.findOne({ name, seller: seller._id })) continue

		await Product.create({
			name,
			description,
			price,
			compareAtPrice,
			stock,
			category,
			images: [img(photo)],
			seller: seller._id,
			isActive: true,
		})
		createdProducts += 1
	}
	console.log(`Products: ${createdProducts} created (${PRODUCTS.length} defined).`)

	// --- flash sales ------------------------------------------------------
	let createdSales = 0
	for (const [productName, salePrice, saleStock, hoursLong] of FLASH_SALES) {
		const product = await Product.findOne({ name: productName, seller: seller._id })
		if (!product) continue
		if (await FlashSale.findOne({ product: product._id, isActive: true })) continue

		await FlashSale.create({
			product: product._id,
			salePrice,
			totalStock: saleStock,
			remainingStock: saleStock,
			startTime: new Date(Date.now() - 60 * 1000),
			endTime: new Date(Date.now() + hoursLong * 60 * 60 * 1000),
			isActive: true,
		})
		createdSales += 1
	}
	console.log(`Flash sales: ${createdSales} created and live.`)

	let createdEvents = 0
	let createdSeats = 0
	for (const [title, type, venue, city, hours, rows, perRow, price, premiumRows, premiumPrice, photo] of EVENTS) {
		if (await Event.findOne({ title, organizer: seller._id })) continue

		const event = await Event.create({
			title,
			description: `${type === 'movie' ? 'Screening' : type === 'sports' ? 'Kick-off' : 'Doors open'} at the ${venue}. Reserved seating.`,
			type,
			venue,
			city,
			startTime: new Date(Date.now() + hours * 60 * 60 * 1000),
			posterImage: img(photo),
			organizer: seller._id,
			totalSeats: rows * perRow,
			isActive: true,
		})

		const seats = []
		for (let r = 0; r < rows; r += 1) {
			const isPremium = r < premiumRows
			for (let n = 1; n <= perRow; n += 1) {
				seats.push({
					event: event._id,
					row: ROW_LABELS[r],
					number: n,
					tier: isPremium ? 'premium' : 'standard',
					price: isPremium ? premiumPrice : price,
					status: 'available',
				})
			}
		}
		await Seat.insertMany(seats)

		const sample = await Seat.find({ event: event._id }).limit(rows * perRow)
		const taken = sample.filter((_, i) => i % 7 === 3).slice(0, Math.floor(rows * perRow * 0.15))
		await Seat.updateMany({ _id: { $in: taken.map((s) => s._id) } }, { $set: { status: 'booked', bookedBy: seller._id } })

		createdEvents += 1
		createdSeats += seats.length
	}
	console.log(`Events: ${createdEvents} created with ${createdSeats} seats.`)

	// --- reviews -----------------------------------------------------------
	const reviewers = []
	for (const [name, email] of REVIEWERS) {
		let reviewer = await User.findOne({ email })
		if (!reviewer) {
			reviewer = await User.create({ name, email, password: 'demoreview123', role: 'buyer' })
		}
		reviewers.push(reviewer)
	}

	const seededProducts = await Product.find({ seller: seller._id })
	let createdReviews = 0

	for (const [index, product] of seededProducts.entries()) {

		const count = [4, 3, 5, 2, 3, 0, 4][index % 7]

		for (let i = 0; i < count; i += 1) {
			const reviewer = reviewers[(index + i) % reviewers.length]
			const [rating, title, comment] = REVIEW_TEXT[(index + i * 3) % REVIEW_TEXT.length]

			const result = await Review.updateOne(
				{ product: product._id, user: reviewer._id },
				{ $set: { rating, title, comment, isVerifiedPurchase: i % 2 === 0 } },
				{ upsert: true },
			)
			if (result.upsertedCount) createdReviews += 1
		}

		await syncProductRating(product._id)
	}
	console.log(`Reviews: ${createdReviews} created across ${seededProducts.length} products.`)

	const categories = await Product.distinct('category', { isActive: true })
	console.log(`Categories now live: ${categories.filter(Boolean).sort().join(', ')}`)

	await mongoose.connection.close()
	console.log('Done.')
}

run().catch(async (error) => {
	console.error(error)
	await mongoose.connection.close()
	process.exit(1)
})
