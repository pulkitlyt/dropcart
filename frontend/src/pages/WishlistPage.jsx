import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Loader2, ArrowLeft } from 'lucide-react'
import { products as productsApi } from '../lib/api'
import { adaptProduct } from '../lib/adapters'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'
import AuthModal from '../components/AuthModal'

const WishlistPage = () => {
	const { ids } = useWishlist()
	const [items, setItems] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

	useEffect(() => {
		if (ids.length === 0) {
			setItems([])
			setIsLoading(false)
			return
		}

		// Wishlist ids are stored locally, so fetch each one; products that were
		// deleted since being saved simply drop out of the list.
		Promise.all(ids.map((id) => productsApi.get(id).catch(() => null)))
			.then((results) => setItems(results.filter(Boolean).map(adaptProduct)))
			.finally(() => setIsLoading(false))
	}, [ids])

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400">
					<ArrowLeft className="h-4 w-4" />
					Back to shop
				</Link>

				<div className="mb-12 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 p-3">
						<Heart className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">Wishlist</h1>
						<p className="mt-1 text-white/50">Saved on this device.</p>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center gap-3 text-white/50">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading...
					</div>
				) : items.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
						<p className="text-white/50">Nothing saved yet. Tap the heart on any product.</p>
						<Link
							to="/products"
							className="mt-6 inline-block rounded-full bg-emerald-500 px-7 py-3 font-semibold text-white hover:bg-emerald-400"
						>
							Browse products
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{items.map((product, index) => (
							<ProductCard
								key={product.id}
								product={product}
								index={index}
								onRequireAuth={() => setIsAuthModalOpen(true)}
							/>
						))}
					</div>
				)}
			</div>

			{isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
		</div>
	)
}

export default WishlistPage
