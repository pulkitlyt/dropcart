import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Heart, Loader2, ArrowLeft, Check, Truck, ShieldCheck, Star, Zap, Clock } from 'lucide-react'
import { products as productsApi } from '../lib/api'
import { adaptProduct } from '../lib/adapters'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import AuthModal from '../components/AuthModal'
import ProductReviews from '../components/ProductReviews'

const ProductDetailPage = () => {
	const { id } = useParams()
	const { isAuthenticated } = useAuth()
	const { addItem } = useCart()
	const { has, toggle } = useWishlist()

	const [product, setProduct] = useState(null)
	const [sale, setSale] = useState(null)
	const [saleLeft, setSaleLeft] = useState('')
	const [quantity, setQuantity] = useState(1)
	const [isLoading, setIsLoading] = useState(true)
	const [status, setStatus] = useState('idle')
	const [error, setError] = useState(null)
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

	useEffect(() => {
		setIsLoading(true)
		productsApi
			.get(id)
			.then((data) => {
				setProduct({ ...adaptProduct(data), description: data.description, raw: data })
				setSale(data.activeFlashSale || null)
				setError(null)
			})
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false))
	}, [id])

	// Mirrors the countdown on the flash-sale card so the two pages agree.
	useEffect(() => {
		if (!sale) return undefined

		const tick = () => {
			const diff = new Date(sale.endTime) - new Date()
			if (diff <= 0) {
				setSale(null)
				return
			}
			const h = Math.floor(diff / 3600000)
			const m = Math.floor((diff / 60000) % 60)
			const s = Math.floor((diff / 1000) % 60)
			setSaleLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
		}

		tick()
		const timer = setInterval(tick, 1000)
		return () => clearInterval(timer)
	}, [sale])

	const handleAddToCart = async () => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true)
			return
		}

		setStatus('adding')
		setError(null)
		try {
			await addItem(product.id, quantity)
			setStatus('added')
			setTimeout(() => setStatus('idle'), 2000)
		} catch (err) {
			setError(err.message)
			setStatus('idle')
		}
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/50">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!product) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
				<h1 className="text-3xl font-bold text-white">Product not found</h1>
				{error && <p className="text-white/50">{error}</p>}
				<Link to="/products" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					Browse products
				</Link>
			</div>
		)
	}

	const isOutOfStock = product.stock <= 0

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-6xl px-6">
				<Link
					to="/products"
					className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400"
				>
					<ArrowLeft className="h-4 w-4" />
					All products
				</Link>

				<div className="grid gap-12 lg:grid-cols-2">
					{/* Image */}
					<motion.div
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900"
					>
						<img src={product.image} alt={product.title} className="aspect-square w-full object-cover" />
						<button
							onClick={() => toggle(product.id)}
							className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/40 p-3 backdrop-blur-xl transition-colors hover:bg-black/60"
						>
							<Heart
								className={`h-5 w-5 transition-all ${
									has(product.id) ? 'fill-red-500 text-red-500' : 'text-white'
								}`}
							/>
						</button>
					</motion.div>

					{/* Details */}
					<div>
						<span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{product.category}</span>
						<h1 className="mt-3 text-4xl font-black leading-tight text-white">{product.title}</h1>

						<div className="mt-4 flex items-center gap-2">
							{product.reviews > 0 ? (
								<>
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`h-4 w-4 ${
												i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'
											}`}
										/>
									))}
									<span className="text-sm text-white/50">
										{product.rating.toFixed(1)} · {product.reviews} review{product.reviews === 1 ? '' : 's'}
									</span>
								</>
							) : (
								<span className="text-sm text-white/30">No ratings yet</span>
							)}
						</div>

						{sale ? (
							<div className="mt-6 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-5">
								<div className="mb-3 flex flex-wrap items-center gap-3">
									<span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1 text-xs font-black text-white">
										<Zap className="h-3.5 w-3.5" />
										FLASH SALE
									</span>
									<span className="flex items-center gap-1.5 font-mono text-sm font-bold text-orange-200">
										<Clock className="h-4 w-4" />
										{saleLeft}
									</span>
									<span className="text-sm text-white/50">{sale.remainingStock} left</span>
								</div>

								<div className="flex items-baseline gap-4">
									<span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-5xl font-black text-transparent">
										₹{sale.salePrice?.toLocaleString('en-IN')}
									</span>
									<span className="text-xl text-white/30 line-through">
										₹{product.price?.toLocaleString('en-IN')}
									</span>
									{product.price > 0 && (
										<span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-300">
											{Math.round(((product.price - sale.salePrice) / product.price) * 100)}% off
										</span>
									)}
								</div>

								<Link
									to="/flash-sales"
									className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-200"
								>
									Grab it on the flash sales page
									<ArrowLeft className="h-4 w-4 rotate-180" />
								</Link>
								<p className="mt-2 text-xs text-white/35">
									Flash-sale price applies at flash-sale checkout, one per customer. Adding to cart buys at the
									regular price.
								</p>
							</div>
						) : (
							<div className="mt-6 flex items-baseline gap-4">
								<span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-5xl font-black text-transparent">
									₹{product.price?.toLocaleString('en-IN')}
								</span>
								{product.compareAtPrice > product.price && (
									<span className="text-xl text-white/30 line-through">
										₹{product.compareAtPrice.toLocaleString('en-IN')}
									</span>
								)}
							</div>
						)}

						<p className="mt-6 leading-relaxed text-white/60">{product.description}</p>

						<p className={`mt-6 font-semibold ${isOutOfStock ? 'text-red-400' : 'text-emerald-400'}`}>
							{isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
						</p>

						{error && (
							<p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300">
								{error}
							</p>
						)}

						<div className="mt-8 flex flex-wrap items-center gap-4">
							<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
								<button
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
									disabled={quantity <= 1}
									className="rounded-full px-4 py-2 text-white/70 hover:bg-white/10 disabled:opacity-30"
								>
									−
								</button>
								<span className="w-10 text-center font-semibold text-white">{quantity}</span>
								<button
									onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
									disabled={quantity >= product.stock}
									className="rounded-full px-4 py-2 text-white/70 hover:bg-white/10 disabled:opacity-30"
								>
									+
								</button>
							</div>

							<motion.button
								onClick={handleAddToCart}
								disabled={isOutOfStock || status === 'adding'}
								whileHover={{ scale: isOutOfStock ? 1 : 1.03 }}
								whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
								className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none"
							>
								{status === 'adding' && <Loader2 className="h-5 w-5 animate-spin" />}
								{status === 'added' ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
								{isOutOfStock ? 'Out of stock' : status === 'added' ? 'Added to cart' : 'Add to cart'}
							</motion.button>
						</div>

						<div className="mt-10 grid grid-cols-2 gap-4">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<Truck className="mb-3 h-5 w-5 text-emerald-400" />
								<div className="font-semibold text-white">Free delivery</div>
								<div className="mt-1 text-sm text-white/50">On orders above ₹999</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<ShieldCheck className="mb-3 h-5 w-5 text-emerald-400" />
								<div className="font-semibold text-white">Secure checkout</div>
								<div className="mt-1 text-sm text-white/50">Protected payments</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-20 border-t border-white/10 pt-14">
					<ProductReviews
						productId={id}
						onRequireAuth={() => setIsAuthModalOpen(true)}
						onRatingChange={(average, count) =>
							setProduct((current) => (current ? { ...current, rating: average, reviews: count } : current))
						}
					/>
				</div>
			</div>

			{isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
		</div>
	)
}

export default ProductDetailPage
