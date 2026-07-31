import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Package, Plus, Trash2, Loader2, ArrowLeft, EyeOff, Zap, Play, Square, Ticket } from 'lucide-react'
import { products as productsApi, flashSales as flashSalesApi, events as eventsApi } from '../lib/api'
import SellerOrders from '../components/SellerOrders'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
	name: '',
	description: '',
	price: '',
	compareAtPrice: '',
	stock: '',
	category: '',
	images: '',
}

// datetime-local wants 'YYYY-MM-DDTHH:mm' in local time.
const toLocalInput = (date) => {
	const offset = date.getTimezoneOffset() * 60000
	return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const EMPTY_EVENT_FORM = () => ({
	title: '',
	type: 'movie',
	venue: '',
	city: '',
	description: '',
	posterImage: '',
	startTime: toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
	rows: '6',
	seatsPerRow: '10',
	price: '',
	premiumRows: '2',
	premiumPrice: '',
})

const EMPTY_SALE_FORM = () => ({
	productId: '',
	salePrice: '',
	totalStock: '',
	startTime: toLocalInput(new Date()),
	endTime: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
})

const SellerPage = () => {
	const { user, isAuthenticated, isLoading: authLoading } = useAuth()
	const [listings, setListings] = useState([])
	const [sales, setSales] = useState([])
	const [myEvents, setMyEvents] = useState([])
	const [form, setForm] = useState(EMPTY_FORM)
	const [saleForm, setSaleForm] = useState(EMPTY_SALE_FORM)
	const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isSavingSale, setIsSavingSale] = useState(false)
	const [isSavingEvent, setIsSavingEvent] = useState(false)
	const [error, setError] = useState(null)

	const canSell = user?.role === 'seller' || user?.role === 'admin'

	const refresh = useCallback(async () => {
		if (!canSell) {
			setIsLoading(false)
			return
		}

		try {
			const [productData, saleData, eventData] = await Promise.all([
				productsApi.mine(),
				flashSalesApi.mine(),
				eventsApi.mine(),
			])
			setListings(productData?.products || [])
			setSales(saleData || [])
			setMyEvents(eventData || [])
			setError(null)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}, [canSell])

	useEffect(() => {
		refresh()
	}, [refresh])

	const handleChange = (field) => (event) => setForm({ ...form, [field]: event.target.value })

	const handleSubmit = async (event) => {
		event.preventDefault()
		setIsSaving(true)
		setError(null)

		try {
			await productsApi.create({
				name: form.name,
				description: form.description,
				price: Number(form.price),
				stock: Number(form.stock),
				category: form.category || undefined,
				compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
				// One URL per line keeps the form simple while the schema takes an array.
				images: form.images
					.split('\n')
					.map((url) => url.trim())
					.filter(Boolean),
			})
			setForm(EMPTY_FORM)
			await refresh()
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async (id) => {
		setError(null)
		try {
			await productsApi.remove(id)
			await refresh()
		} catch (err) {
			setError(err.message)
		}
	}

	const handleSaleChange = (field) => (event) => setSaleForm({ ...saleForm, [field]: event.target.value })

	const handleCreateSale = async (event) => {
		event.preventDefault()
		setIsSavingSale(true)
		setError(null)

		try {
			const sale = await flashSalesApi.create({
				productId: saleForm.productId,
				salePrice: Number(saleForm.salePrice),
				totalStock: Number(saleForm.totalStock),
				startTime: new Date(saleForm.startTime).toISOString(),
				endTime: new Date(saleForm.endTime).toISOString(),
				perUserLimit: 1,
			})
			// Sales are created inactive; activate immediately so it goes live.
			await flashSalesApi.activate(sale._id)
			setSaleForm(EMPTY_SALE_FORM())
			await refresh()
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSavingSale(false)
		}
	}

	const handleEventChange = (field) => (event) => setEventForm({ ...eventForm, [field]: event.target.value })

	const handleCreateEvent = async (event) => {
		event.preventDefault()
		setIsSavingEvent(true)
		setError(null)

		try {
			await eventsApi.create({
				title: eventForm.title,
				type: eventForm.type,
				venue: eventForm.venue,
				city: eventForm.city || undefined,
				description: eventForm.description || undefined,
				posterImage: eventForm.posterImage || undefined,
				startTime: new Date(eventForm.startTime).toISOString(),
				rows: Number(eventForm.rows),
				seatsPerRow: Number(eventForm.seatsPerRow),
				price: Number(eventForm.price),
				premiumRows: Number(eventForm.premiumRows) || 0,
				premiumPrice: eventForm.premiumPrice ? Number(eventForm.premiumPrice) : undefined,
			})
			setEventForm(EMPTY_EVENT_FORM())
			await refresh()
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSavingEvent(false)
		}
	}

	const toggleSale = async (sale) => {
		setError(null)
		try {
			await (sale.isActive ? flashSalesApi.end(sale._id) : flashSalesApi.activate(sale._id))
			await refresh()
		} catch (err) {
			setError(err.message)
		}
	}

	if (authLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/50">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!isAuthenticated || !canSell) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
				<h1 className="text-3xl font-bold text-white">Seller access only</h1>
				<p className="max-w-md text-white/50">
					{isAuthenticated
						? `You're signed in as a ${user?.role}. Create a seller account to list products.`
						: 'Sign in with a seller account to list products.'}
				</p>
				<Link to="/" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					Back to shop
				</Link>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-zinc-950 pt-28 pb-24">
			<div className="mx-auto max-w-7xl px-6">
				<Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400">
					<ArrowLeft className="h-4 w-4" />
					Back to shop
				</Link>

				<div className="mb-12 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3">
						<Package className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">Your listings</h1>
						<p className="mt-1 text-white/50">Signed in as {user?.name}</p>
					</div>
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				<div className="grid gap-10 lg:grid-cols-[380px_1fr]">
					{/* Create form */}
					<form
						onSubmit={handleSubmit}
						className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
					>
						<h2 className="mb-5 text-lg font-bold text-white">List a new product</h2>

						<div className="flex flex-col gap-3">
							<input
								required
								placeholder="Product name"
								value={form.name}
								onChange={handleChange('name')}
								className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>
							<textarea
								required
								rows={3}
								placeholder="Description"
								value={form.description}
								onChange={handleChange('description')}
								className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>
							<div className="grid grid-cols-2 gap-3">
								<input
									required
									type="number"
									min="0"
									placeholder="Price ₹"
									value={form.price}
									onChange={handleChange('price')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
								/>
								<input
									type="number"
									min="0"
									placeholder="Compare at ₹"
									value={form.compareAtPrice}
									onChange={handleChange('compareAtPrice')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<input
									required
									type="number"
									min="0"
									placeholder="Stock"
									value={form.stock}
									onChange={handleChange('stock')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
								/>
								<input
									placeholder="Category"
									value={form.category}
									onChange={handleChange('category')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
								/>
							</div>
							<textarea
								rows={2}
								placeholder="Image URLs, one per line"
								value={form.images}
								onChange={handleChange('images')}
								className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>

							<motion.button
								type="submit"
								disabled={isSaving}
								whileHover={{ scale: isSaving ? 1 : 1.02 }}
								whileTap={{ scale: isSaving ? 1 : 0.98 }}
								className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
							>
								{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
								List product
							</motion.button>
						</div>
					</form>

					{/* Existing listings */}
					<div>
						{isLoading ? (
							<div className="flex items-center gap-3 text-white/50">
								<Loader2 className="h-5 w-5 animate-spin" />
								Loading your listings...
							</div>
						) : listings.length === 0 ? (
							<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/50">
								You haven't listed anything yet. Use the form to add your first product.
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{listings.map((product) => (
									<motion.div
										key={product._id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl"
									>
										<div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
											{product.images?.[0] && (
												<img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
											)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<h3 className="truncate font-bold text-white">{product.name}</h3>
												{!product.isActive && (
													<span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
														<EyeOff className="h-3 w-3" />
														hidden
													</span>
												)}
											</div>
											<p className="truncate text-sm text-white/45">{product.description}</p>
											<div className="mt-1 flex items-center gap-3 text-sm">
												<span className="font-bold text-emerald-400">
													₹{product.price?.toLocaleString('en-IN')}
												</span>
												<span className="text-white/40">{product.stock} in stock</span>
												{product.category && <span className="text-white/40">· {product.category}</span>}
											</div>
										</div>

										<button
											onClick={() => handleDelete(product._id)}
											title="Delete listing"
											className="rounded-full p-3 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
										>
											<Trash2 className="h-5 w-5" />
										</button>
									</motion.div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Flash sales */}
				<div className="mt-16 border-t border-white/10 pt-12">
					<div className="mb-8 flex items-center gap-3">
						<div className="rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 p-3">
							<Zap className="h-6 w-6 text-white" />
						</div>
						<div>
							<h2 className="text-3xl font-bold text-white">Flash sales</h2>
							<p className="mt-1 text-white/50">Put a listing on a timed, limited-stock drop.</p>
						</div>
					</div>

					<div className="grid gap-10 lg:grid-cols-[380px_1fr]">
						<form
							onSubmit={handleCreateSale}
							className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
						>
							<div className="flex flex-col gap-3">
								<select
									required
									value={saleForm.productId}
									onChange={handleSaleChange('productId')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500/60 focus:outline-none"
								>
									<option value="" className="bg-zinc-900">
										Select a product
									</option>
									{listings.map((product) => (
										<option key={product._id} value={product._id} className="bg-zinc-900">
											{product.name} ({product.stock} in stock)
										</option>
									))}
								</select>

								<div className="grid grid-cols-2 gap-3">
									<input
										required
										type="number"
										min="0"
										placeholder="Sale price ₹"
										value={saleForm.salePrice}
										onChange={handleSaleChange('salePrice')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
									/>
									<input
										required
										type="number"
										min="1"
										placeholder="Sale stock"
										value={saleForm.totalStock}
										onChange={handleSaleChange('totalStock')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
									/>
								</div>

								<label className="text-xs text-white/40">Starts</label>
								<input
									required
									type="datetime-local"
									value={saleForm.startTime}
									onChange={handleSaleChange('startTime')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500/60 focus:outline-none"
								/>
								<label className="text-xs text-white/40">Ends</label>
								<input
									required
									type="datetime-local"
									value={saleForm.endTime}
									onChange={handleSaleChange('endTime')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500/60 focus:outline-none"
								/>

								<motion.button
									type="submit"
									disabled={isSavingSale || listings.length === 0}
									whileHover={{ scale: isSavingSale ? 1 : 1.02 }}
									whileTap={{ scale: isSavingSale ? 1 : 0.98 }}
									className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50"
								>
									{isSavingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
									Launch flash sale
								</motion.button>

								{listings.length === 0 && (
									<p className="text-center text-xs text-white/35">List a product first.</p>
								)}
							</div>
						</form>

						<div>
							{sales.length === 0 ? (
								<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/50">
									No flash sales yet.
								</div>
							) : (
								<div className="flex flex-col gap-4">
									{sales.map((sale) => {
										const isLive =
											sale.isActive &&
											new Date(sale.startTime) <= new Date() &&
											new Date(sale.endTime) > new Date()

										return (
											<div
												key={sale._id}
												className="flex items-center gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl"
											>
												<div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
													{sale.product?.images?.[0] && (
														<img
															src={sale.product.images[0]}
															alt={sale.product.name}
															className="h-full w-full object-cover"
														/>
													)}
												</div>

												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<h3 className="truncate font-bold text-white">{sale.product?.name}</h3>
														<span
															className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
																isLive
																	? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
																	: 'border-white/10 bg-white/5 text-white/45'
															}`}
														>
															{isLive ? 'live' : sale.isActive ? 'scheduled/ended' : 'inactive'}
														</span>
													</div>
													<div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
														<span className="font-bold text-emerald-400">
															₹{sale.salePrice?.toLocaleString('en-IN')}
														</span>
														<span className="text-white/40 line-through">
															₹{sale.product?.price?.toLocaleString('en-IN')}
														</span>
														<span className="text-white/40">
															{sale.remainingStock}/{sale.totalStock} left
														</span>
													</div>
													<p className="mt-1 text-xs text-white/30">
														{new Date(sale.startTime).toLocaleString('en-IN', {
															dateStyle: 'medium',
															timeStyle: 'short',
														})}
														{' → '}
														{new Date(sale.endTime).toLocaleString('en-IN', {
															dateStyle: 'medium',
															timeStyle: 'short',
														})}
													</p>
												</div>

												<button
													onClick={() => toggleSale(sale)}
													title={sale.isActive ? 'End sale' : 'Activate sale'}
													className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
												>
													{sale.isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
													{sale.isActive ? 'End' : 'Activate'}
												</button>
											</div>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Events */}
				<div className="mt-16 border-t border-white/10 pt-12">
					<div className="mb-8 flex items-center gap-3">
						<div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 p-3">
							<Ticket className="h-6 w-6 text-white" />
						</div>
						<div>
							<h2 className="text-3xl font-bold text-white">Events</h2>
							<p className="mt-1 text-white/50">Sell tickets with reserved seating.</p>
						</div>
					</div>

					<div className="grid gap-10 lg:grid-cols-[380px_1fr]">
						<form
							onSubmit={handleCreateEvent}
							className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
						>
							<div className="flex flex-col gap-3">
								<input
									required
									placeholder="Event title"
									value={eventForm.title}
									onChange={handleEventChange('title')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
								/>
								<select
									value={eventForm.type}
									onChange={handleEventChange('type')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-fuchsia-500/60 focus:outline-none"
								>
									{['movie', 'sports', 'concert', 'theatre'].map((t) => (
										<option key={t} value={t} className="bg-zinc-900 capitalize">
											{t}
										</option>
									))}
								</select>
								<div className="grid grid-cols-2 gap-3">
									<input
										required
										placeholder="Venue"
										value={eventForm.venue}
										onChange={handleEventChange('venue')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
									<input
										placeholder="City"
										value={eventForm.city}
										onChange={handleEventChange('city')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
								</div>
								<input
									placeholder="Poster image URL"
									value={eventForm.posterImage}
									onChange={handleEventChange('posterImage')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
								/>
								<label className="text-xs text-white/40">Starts</label>
								<input
									required
									type="datetime-local"
									value={eventForm.startTime}
									onChange={handleEventChange('startTime')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-fuchsia-500/60 focus:outline-none"
								/>

								<label className="mt-2 text-xs text-white/40">Seating grid</label>
								<div className="grid grid-cols-2 gap-3">
									<input
										required
										type="number"
										min="1"
										max="26"
										placeholder="Rows"
										value={eventForm.rows}
										onChange={handleEventChange('rows')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
									<input
										required
										type="number"
										min="1"
										max="40"
										placeholder="Seats / row"
										value={eventForm.seatsPerRow}
										onChange={handleEventChange('seatsPerRow')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<input
										required
										type="number"
										min="0"
										placeholder="Price ₹"
										value={eventForm.price}
										onChange={handleEventChange('price')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
									<input
										type="number"
										min="0"
										placeholder="Premium ₹"
										value={eventForm.premiumPrice}
										onChange={handleEventChange('premiumPrice')}
										className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
									/>
								</div>
								<input
									type="number"
									min="0"
									placeholder="Premium front rows"
									value={eventForm.premiumRows}
									onChange={handleEventChange('premiumRows')}
									className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-fuchsia-500/60 focus:outline-none"
								/>

								<motion.button
									type="submit"
									disabled={isSavingEvent}
									whileHover={{ scale: isSavingEvent ? 1 : 1.02 }}
									whileTap={{ scale: isSavingEvent ? 1 : 0.98 }}
									className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50"
								>
									{isSavingEvent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
									Create event
								</motion.button>
								<p className="text-center text-xs text-white/30">
									{Number(eventForm.rows) * Number(eventForm.seatsPerRow) || 0} seats will be generated.
								</p>
							</div>
						</form>

						<div>
							{myEvents.length === 0 ? (
								<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/50">
									No events yet.
								</div>
							) : (
								<div className="flex flex-col gap-4">
									{myEvents.map((item) => (
										<Link
											key={item._id}
											to={`/events/${item._id}`}
											className="flex items-center gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl transition-colors hover:border-fuchsia-500/40"
										>
											<div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
												{item.posterImage && (
													<img src={item.posterImage} alt={item.title} className="h-full w-full object-cover" />
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<h3 className="truncate font-bold text-white">{item.title}</h3>
													<span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-fuchsia-300">
														{item.type}
													</span>
												</div>
												<p className="truncate text-sm text-white/45">
													{item.venue}
													{item.city ? `, ${item.city}` : ''}
												</p>
												<p className="mt-1 text-xs text-white/30">
													{new Date(item.startTime).toLocaleString('en-IN', {
														dateStyle: 'medium',
														timeStyle: 'short',
													})}
													{' · '}
													{item.totalSeats} seats
												</p>
											</div>
										</Link>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				<SellerOrders />
			</div>
		</div>
	)
}

export default SellerPage
