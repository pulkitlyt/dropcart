import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Loader2, RefreshCw, Ticket, Zap, Home, Truck, PackageCheck, XCircle } from 'lucide-react'
import { orders as ordersApi } from '../lib/api'

const STATUS_STYLES = {
	confirmed: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
	pending: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
	shipped: 'border-blue-500/30 bg-blue-500/15 text-blue-300',
	delivered: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
	cancelled: 'border-red-500/30 bg-red-500/15 text-red-300',
}

// Mirrors ALLOWED_TRANSITIONS on the server so the UI never offers a move the
// API would reject.
const NEXT_ACTIONS = {
	pending: [{ status: 'confirmed', label: 'Confirm', Icon: PackageCheck }, { status: 'cancelled', label: 'Cancel', Icon: XCircle }],
	confirmed: [{ status: 'shipped', label: 'Mark shipped', Icon: Truck }, { status: 'cancelled', label: 'Cancel', Icon: XCircle }],
	shipped: [{ status: 'delivered', label: 'Mark delivered', Icon: PackageCheck }],
	delivered: [],
	cancelled: [],
}

const SellerOrders = () => {
	const [orders, setOrders] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [busyId, setBusyId] = useState(null)
	const [error, setError] = useState(null)

	const refresh = useCallback(async () => {
		try {
			setOrders((await ordersApi.seller()) || [])
			setError(null)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	const setStatus = async (id, status) => {
		setBusyId(id)
		setError(null)
		try {
			await ordersApi.updateStatus(id, status)
			await refresh()
		} catch (err) {
			setError(err.message)
		} finally {
			setBusyId(null)
		}
	}

	const revenue = orders
		.filter((o) => o.status !== 'cancelled')
		.reduce((sum, o) => sum + (o.sellerTotal || 0), 0)

	return (
		<div className="mt-16 border-t border-white/10 pt-12">
			<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
						<Receipt className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 className="text-3xl font-bold text-white">Orders</h2>
						<p className="mt-1 text-white/50">
							{orders.length} order{orders.length === 1 ? '' : 's'} · ₹{revenue.toLocaleString('en-IN')} earned
						</p>
					</div>
				</div>
				<button
					onClick={refresh}
					className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
				>
					<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
					Refresh
				</button>
			</div>

			{error && (
				<p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
			)}

			{isLoading ? (
				<div className="flex items-center gap-3 text-white/50">
					<Loader2 className="h-5 w-5 animate-spin" />
					Loading orders...
				</div>
			) : orders.length === 0 ? (
				<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/50">
					No orders for your listings yet.
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{orders.map((order) => {
						const actions = NEXT_ACTIONS[order.status] || []
						const lines = order.sellerItems?.length
							? order.sellerItems
							: order.product
								? [{ product: order.product, quantity: order.quantity, price: order.totalAmount }]
								: []

						return (
							<motion.div
								key={order._id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl"
							>
								<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
									<div className="flex flex-wrap items-center gap-3">
										<span className="font-mono text-xs text-white/35">#{order._id.slice(-8)}</span>
										{order.isTicketOrder && (
											<span className="flex items-center gap-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-300">
												<Ticket className="h-3 w-3" /> Ticket
											</span>
										)}
										{order.isFlashSaleOrder && (
											<span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-300">
												<Zap className="h-3 w-3" /> Flash sale
											</span>
										)}
										<span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
											{order.status}
										</span>
									</div>
									<span className="text-xs text-white/35">
										{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
									</span>
								</div>

								<p className="mb-3 text-sm text-white/50">
									Buyer: <span className="text-white/75">{order.user?.name}</span>
									{order.user?.email && <span className="text-white/30"> · {order.user.email}</span>}
								</p>

								{order.isTicketOrder ? (
									<div>
										<p className="font-semibold text-white">{order.event?.title}</p>
										<div className="mt-2 flex flex-wrap gap-2">
											{order.seats?.map((seat) => (
												<span key={seat.label} className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold text-white/80">
													{seat.label}
												</span>
											))}
										</div>
									</div>
								) : (
									<div className="flex flex-col gap-3">
										{lines.map((line, index) => (
											<div key={line.product?._id || index} className="flex items-center gap-4">
												<div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
													{line.product?.images?.[0] && (
														<img src={line.product.images[0]} alt="" className="h-full w-full object-cover" />
													)}
												</div>
												<span className="min-w-0 flex-1 truncate text-sm text-white/75">{line.product?.name}</span>
												<span className="text-sm text-white/40">× {line.quantity}</span>
												<span className="text-sm text-white/60">₹{(line.price * line.quantity).toLocaleString('en-IN')}</span>
											</div>
										))}
									</div>
								)}

								{order.shippingAddress?.line1 && (
									<p className="mt-4 flex items-start gap-2 text-sm text-white/45">
										<Home className="mt-0.5 h-4 w-4 shrink-0" />
										<span>
											{order.shippingAddress.fullName}, {order.shippingAddress.line1},{' '}
											{order.shippingAddress.city} {order.shippingAddress.pincode} · {order.shippingAddress.phone}
										</span>
									</p>
								)}

								<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
									<span className="text-lg font-bold text-emerald-400">
										₹{order.sellerTotal?.toLocaleString('en-IN')}
										{order.sellerTotal !== order.totalAmount && (
											<span className="ml-2 text-xs font-normal text-white/30">
												your share of ₹{order.totalAmount?.toLocaleString('en-IN')}
											</span>
										)}
									</span>

									<div className="flex flex-wrap gap-2">
										{!order.canUpdateStatus && actions.length > 0 && (
											<span className="text-xs text-white/30">Shared order — only the buyer or an admin can update</span>
										)}
										{order.canUpdateStatus &&
											actions.map(({ status, label, Icon }) => (
												<button
													key={status}
													onClick={() => setStatus(order._id, status)}
													disabled={busyId === order._id}
													className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
														status === 'cancelled'
															? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
															: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
													}`}
												>
													{busyId === order._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
													{label}
												</button>
											))}
									</div>
								</div>
							</motion.div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default SellerOrders
