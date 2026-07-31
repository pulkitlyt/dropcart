import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Minus, Plus, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const CartPage = () => {
	const navigate = useNavigate()
	const { isAuthenticated, isLoading: authLoading } = useAuth()
	const { items, subtotal, totalItems, isLoading, updateQuantity, removeItem, refresh } = useCart()
	const [busyId, setBusyId] = useState(null)
	const [error, setError] = useState(null)

	const handleQuantity = async (productId, quantity) => {
		if (quantity < 1) return
		setBusyId(productId)
		setError(null)
		try {
			await updateQuantity(productId, quantity)
		} catch (err) {
			setError(err.message)
		} finally {
			setBusyId(null)
		}
	}

	const handleRemove = async (productId) => {
		setBusyId(productId)
		setError(null)
		try {
			await removeItem(productId)
		} catch (err) {
			setError(err.message)
		} finally {
			setBusyId(null)
		}
	}

	// Address and payment are collected on /checkout; the order is placed there.
	const handleCheckout = () => navigate('/checkout')

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
				<ShoppingCart className="h-10 w-10 text-white/25" />
				<h1 className="text-3xl font-bold text-white">Sign in to see your cart</h1>
				<Link to="/" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					Back to shop
				</Link>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-6xl px-6">
				<Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400">
					<ArrowLeft className="h-4 w-4" />
					Continue shopping
				</Link>

				<div className="mb-10 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3">
						<ShoppingCart className="h-6 w-6 text-white" />
					</div>
					<h1 className="text-4xl font-bold text-white">
						Your cart {totalItems > 0 && <span className="text-white/40">({totalItems})</span>}
					</h1>
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				{items.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
						<p className="text-white/50">Your cart is empty.</p>
						<Link
							to="/"
							className="mt-6 inline-block rounded-full bg-emerald-500 px-7 py-3 font-semibold text-white hover:bg-emerald-400"
						>
							Browse products
						</Link>
					</div>
				) : (
					<div className="grid gap-8 lg:grid-cols-[1fr_340px]">
						<div className="flex flex-col gap-4">
							{items.map((item) => {
								const product = item.product
								const isBusy = busyId === product?._id

								return (
									<motion.div
										key={product?._id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										className="flex items-center gap-5 rounded-3xl border border-white/10 bg-zinc-900/60 p-4 backdrop-blur-xl"
									>
										<div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
											{product?.images?.[0] && (
												<img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
											)}
										</div>

										<div className="min-w-0 flex-1">
											<h3 className="truncate font-bold text-white">{product?.name}</h3>
											{product?.category && <p className="text-sm text-white/40">{product.category}</p>}
											<p className="mt-1 font-bold text-emerald-400">
												₹{product?.price?.toLocaleString('en-IN')}
											</p>
											<p className="mt-1 text-xs text-white/35">{product?.stock} in stock</p>
										</div>

										<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
											<button
												onClick={() => handleQuantity(product._id, item.quantity - 1)}
												disabled={isBusy || item.quantity <= 1}
												className="rounded-full p-2 text-white/70 hover:bg-white/10 disabled:opacity-30"
											>
												<Minus className="h-4 w-4" />
											</button>
											<span className="w-8 text-center font-semibold text-white">
												{isBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : item.quantity}
											</span>
											<button
												onClick={() => handleQuantity(product._id, item.quantity + 1)}
												disabled={isBusy || item.quantity >= (product?.stock ?? 0)}
												className="rounded-full p-2 text-white/70 hover:bg-white/10 disabled:opacity-30"
											>
												<Plus className="h-4 w-4" />
											</button>
										</div>

										<button
											onClick={() => handleRemove(product._id)}
											disabled={isBusy}
											title="Remove"
											className="rounded-full p-3 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
										>
											<Trash2 className="h-5 w-5" />
										</button>
									</motion.div>
								)
							})}
						</div>

						{/* Summary */}
						<div className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl">
							<h2 className="mb-5 text-lg font-bold text-white">Order summary</h2>

							<div className="flex flex-col gap-3 text-sm">
								<div className="flex justify-between text-white/60">
									<span>Items</span>
									<span>{totalItems}</span>
								</div>
								<div className="flex justify-between text-white/60">
									<span>Delivery</span>
									<span className="text-emerald-400">{subtotal >= 999 ? 'Free' : '₹49'}</span>
								</div>
								<div className="mt-3 flex justify-between border-t border-white/10 pt-4 text-lg font-bold text-white">
									<span>Total</span>
									<span>₹{(subtotal + (subtotal >= 999 ? 0 : 49)).toLocaleString('en-IN')}</span>
								</div>
							</div>

							<motion.button
								onClick={handleCheckout}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
							>
								Checkout
							</motion.button>

							<p className="mt-4 text-center text-xs text-white/30">
								Stock is claimed when you place the order, not when you add to cart.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default CartPage
