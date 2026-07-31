import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Receipt, Loader2, ArrowLeft, CheckCircle2, Zap, Ticket, MapPin, Calendar, CreditCard, Home } from 'lucide-react'

import { orders as ordersApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const PaymentLine = ({ payment }) => {
	if (!payment?.method) return null
	const text =
		payment.method === 'card'
			? `${payment.cardBrand} •••• ${payment.last4}`
			: payment.method === 'upi'
				? `UPI · ${payment.upiId}`
				: 'Cash on delivery'
	return (
		<span className="flex items-center gap-2 text-sm text-white/45">
			<CreditCard className="h-4 w-4" />
			{text}
		</span>
	)
}

const STATUS_STYLES = {
	confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
	pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
	shipped: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
	delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
	cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const OrdersPage = () => {
	const { isAuthenticated, isLoading: authLoading } = useAuth()
	const [searchParams] = useSearchParams()
	const justPlacedId = searchParams.get('placed')

	const [orders, setOrders] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		if (authLoading) return
		if (!isAuthenticated) {
			setIsLoading(false)
			return
		}

		ordersApi
			.list()
			.then((data) => setOrders(data || []))
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false))
	}, [isAuthenticated, authLoading])

	if (authLoading || isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/50">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
				<h1 className="text-3xl font-bold text-white">Sign in to see your orders</h1>
				<Link to="/" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					Back to shop
				</Link>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-4xl px-6">
				<Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400">
					<ArrowLeft className="h-4 w-4" />
					Back to shop
				</Link>

				<div className="mb-10 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3">
						<Receipt className="h-6 w-6 text-white" />
					</div>
					<h1 className="text-4xl font-bold text-white">Your orders</h1>
				</div>

				{justPlacedId && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-300"
					>
						<CheckCircle2 className="h-5 w-5 shrink-0" />
						Order placed successfully.
					</motion.div>
				)}

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				{orders.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						No orders yet.
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{orders.map((order) => {
							// Flash-sale orders carry a single `product`; cart orders use `items`.
							const lines = order.items?.length
								? order.items
								: [{ product: order.product, quantity: order.quantity, price: order.totalAmount }]

							const isTicket = order.type === 'ticket' || Boolean(order.event)

							if (isTicket) {
								return (
									<motion.div
										key={order._id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										className={`overflow-hidden rounded-3xl border bg-zinc-900/60 backdrop-blur-xl ${
											order._id === justPlacedId ? 'border-fuchsia-500/50' : 'border-white/10'
										}`}
									>
										<div className="flex items-center justify-between border-b border-dashed border-white/10 bg-gradient-to-r from-fuchsia-500/10 to-purple-600/10 px-6 py-4">
											<span className="flex items-center gap-2 text-sm font-bold text-fuchsia-300">
												<Ticket className="h-4 w-4" />
												E-TICKET
											</span>
											<span className="font-mono text-xs text-white/35">#{order._id.slice(-8)}</span>
										</div>

										<div className="p-6">
											<h3 className="text-xl font-bold text-white">
												{order.event?.title || 'Event'}
											</h3>
											{order.event && (
												<div className="mt-3 flex flex-wrap gap-5 text-sm text-white/50">
													<span className="flex items-center gap-2">
														<MapPin className="h-4 w-4" />
														{order.event.venue}
													</span>
													<span className="flex items-center gap-2">
														<Calendar className="h-4 w-4" />
														{new Date(order.event.startTime).toLocaleString('en-IN', {
															dateStyle: 'medium',
															timeStyle: 'short',
														})}
													</span>
												</div>
											)}

											<div className="mt-5">
												<p className="mb-2 text-xs uppercase tracking-wider text-white/35">
													Seats ({order.seats?.length})
												</p>
												<div className="flex flex-wrap gap-2">
													{order.seats?.map((seat) => (
														<span
															key={seat.label}
															className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
																seat.tier === 'premium'
																	? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
																	: 'border-white/15 bg-white/5 text-white/80'
															}`}
														>
															{seat.label}
														</span>
													))}
												</div>
											</div>

											<div className="mt-5 border-t border-white/10 pt-4">
												<PaymentLine payment={order.payment} />
											</div>

											<div className="mt-4 flex justify-between">
												<span className="text-white/50">Total</span>
												<span className="text-lg font-bold text-fuchsia-300">
													₹{order.totalAmount?.toLocaleString('en-IN')}
												</span>
											</div>
										</div>
									</motion.div>
								)
							}

							return (
								<motion.div
									key={order._id}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									className={`rounded-3xl border bg-zinc-900/60 p-6 backdrop-blur-xl ${
										order._id === justPlacedId ? 'border-emerald-500/50' : 'border-white/10'
									}`}
								>
									<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
										<div className="flex items-center gap-3">
											<span className="font-mono text-xs text-white/35">#{order._id.slice(-8)}</span>
											{order.flashSale && (
												<span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-300">
													<Zap className="h-3 w-3" />
													Flash sale
												</span>
											)}
											<span
												className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
													STATUS_STYLES[order.status] || STATUS_STYLES.pending
												}`}
											>
												{order.status}
											</span>
										</div>
										<span className="text-sm text-white/40">
											{new Date(order.createdAt).toLocaleString('en-IN', {
												dateStyle: 'medium',
												timeStyle: 'short',
											})}
										</span>
									</div>

									<div className="flex flex-col gap-3">
										{lines.map((line, index) => (
											<div key={line.product?._id || index} className="flex items-center gap-4">
												<div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
													{line.product?.images?.[0] && (
														<img
															src={line.product.images[0]}
															alt={line.product.name}
															className="h-full w-full object-cover"
														/>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate font-semibold text-white">
														{line.product?.name || 'Item no longer available'}
													</p>
													<p className="text-sm text-white/40">Qty {line.quantity}</p>
												</div>
												<span className="text-sm text-white/60">
													₹{line.price?.toLocaleString('en-IN')}
												</span>
											</div>
										))}
									</div>

									{(order.shippingAddress?.line1 || order.payment?.method) && (
										<div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
											{order.shippingAddress?.line1 && (
												<span className="flex items-start gap-2 text-sm text-white/45">
													<Home className="mt-0.5 h-4 w-4 shrink-0" />
													<span>
														{order.shippingAddress.fullName} ·{' '}
														{[
															order.shippingAddress.line1,
															order.shippingAddress.city,
															order.shippingAddress.pincode,
														]
															.filter(Boolean)
															.join(', ')}
													</span>
												</span>
											)}
											<PaymentLine payment={order.payment} />
										</div>
									)}

									<div className="mt-5 flex justify-between border-t border-white/10 pt-4">
										<span className="text-white/50">Total</span>
										<span className="text-lg font-bold text-emerald-400">
											₹{order.totalAmount?.toLocaleString('en-IN')}
										</span>
									</div>
								</motion.div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default OrdersPage
