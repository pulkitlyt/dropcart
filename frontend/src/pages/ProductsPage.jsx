import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { Search, Loader2, Package, X } from 'lucide-react'
import { products as productsApi } from '../lib/api'
import { adaptProduct } from '../lib/adapters'
import ProductCard from '../components/ProductCard'
import AuthModal from '../components/AuthModal'

const PAGE_SIZE = 12

const ProductsPage = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const category = searchParams.get('category') || ''
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const [searchDraft, setSearchDraft] = useState(search)
	const [categories, setCategories] = useState([])
	const [items, setItems] = useState([])
	const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

	useEffect(() => {
		setSearchDraft(search)
	}, [search])

	useEffect(() => {
		productsApi
			.categories()
			.then((data) => setCategories(data || []))
			.catch(() => setCategories([]))
	}, [])

	useEffect(() => {
		setIsLoading(true)
		productsApi
			.list({ category: category || undefined, search: search || undefined, page, limit: PAGE_SIZE })
			.then((data) => {
				setItems((data?.products || []).map(adaptProduct))
				setMeta({ total: data?.total || 0, totalPages: data?.totalPages || 1 })
				setError(null)
			})
			.catch((err) => {
				setError(err.message)
				setItems([])
			})
			.finally(() => setIsLoading(false))
	}, [category, search, page])

	// Changing a filter always resets to page 1; stale pages show nothing.
	const updateParams = (next) => {
		const params = new URLSearchParams(searchParams)
		Object.entries(next).forEach(([key, value]) => {
			if (value) params.set(key, value)
			else params.delete(key)
		})
		if (!('page' in next)) params.delete('page')
		setSearchParams(params)
	}

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<div className="mb-10 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-3">
						<Package className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">
							{category ? category : search ? `Results for "${search}"` : 'All products'}
						</h1>
						<p className="mt-1 text-white/50">
							{isLoading ? 'Loading…' : `${meta.total} product${meta.total === 1 ? '' : 's'}`}
						</p>
					</div>
				</div>

				{/* Search */}
				<form
					onSubmit={(event) => {
						event.preventDefault()
						updateParams({ search: searchDraft })
					}}
					className="mb-6 flex gap-3"
				>
					<div className="relative flex-1">
						<Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
						<input
							value={searchDraft}
							onChange={(event) => setSearchDraft(event.target.value)}
							placeholder="Search products..."
							className="w-full rounded-full border border-white/10 bg-white/5 py-4 pl-14 pr-5 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
						/>
					</div>
					<button
						type="submit"
						className="rounded-full bg-emerald-500 px-8 font-semibold text-white transition-colors hover:bg-emerald-400"
					>
						Search
					</button>
				</form>

				{/* Category chips */}
				<div className="mb-12 flex flex-wrap gap-3">
					<button
						onClick={() => updateParams({ category: '' })}
						className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
							!category
								? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
								: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
						}`}
					>
						All
					</button>
					{categories.map((name) => (
						<button
							key={name}
							onClick={() => updateParams({ category: name })}
							className={`rounded-full border px-5 py-2 text-sm font-medium capitalize transition-all ${
								category.toLowerCase() === name.toLowerCase()
									? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
									: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
							}`}
						>
							{name}
						</button>
					))}
					{(category || search) && (
						<button
							onClick={() => setSearchParams(new URLSearchParams())}
							className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/50 hover:text-white"
						>
							<X className="h-4 w-4" />
							Clear
						</button>
					)}
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				{isLoading ? (
					<div className="flex items-center gap-3 text-white/50">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading products...
					</div>
				) : items.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						No products match this filter.
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

				{/* Pagination */}
				{meta.totalPages > 1 && (
					<div className="mt-14 flex items-center justify-center gap-2">
						{Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((n) => (
							<motion.button
								key={n}
								whileHover={{ scale: 1.08 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => updateParams({ page: String(n), category, search })}
								className={`h-11 w-11 rounded-full border font-semibold transition-all ${
									n === page
										? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
										: 'border-white/10 bg-white/5 text-white/60 hover:text-white'
								}`}
							>
								{n}
							</motion.button>
						))}
					</div>
				)}
			</div>

			{isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
		</div>
	)
}

export default ProductsPage
