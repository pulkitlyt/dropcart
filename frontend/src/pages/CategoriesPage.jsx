import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shirt, Laptop, BookOpen, Home, Sparkles, Dumbbell, Gamepad2, ShoppingBasket, Tag, Loader2 } from 'lucide-react'
import { products as productsApi } from '../lib/api'
import { categories as fallbackCategories } from '../mock'

const iconMap = { Shirt, Laptop, BookOpen, Home, Sparkles, Dumbbell, Gamepad2, ShoppingBasket }

const iconForName = (name) => {
	const match = fallbackCategories.find((c) => c.name.toLowerCase() === name.toLowerCase())
	return (match && iconMap[match.icon]) || Tag
}

const CategoriesPage = () => {
	const [categories, setCategories] = useState([])
	const [counts, setCounts] = useState({})
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		productsApi
			.categories()
			.then(async (names) => {
				const list = names || []
				setCategories(list)

				// One count per category so each tile shows how much is actually in it.
				const results = await Promise.all(
					list.map((name) =>
						productsApi
							.list({ category: name, limit: 1 })
							.then((data) => [name, data?.total || 0])
							.catch(() => [name, 0]),
					),
				)
				setCounts(Object.fromEntries(results))
			})
			.catch(() => setCategories([]))
			.finally(() => setIsLoading(false))
	}, [])

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<div className="mb-12 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-3">
						<Tag className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">Categories</h1>
						<p className="mt-1 text-white/50">Browse everything by department.</p>
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center gap-3 text-white/50">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading categories...
					</div>
				) : categories.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						No categories yet — they appear here as soon as products are listed.
					</div>
				) : (
					<div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
						{categories.map((name, index) => {
							const Icon = iconForName(name)
							return (
								<motion.div
									key={name}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									whileHover={{ scale: 1.03, y: -4 }}
									whileTap={{ scale: 0.97 }}
								>
									<Link
										to={`/products?category=${encodeURIComponent(name)}`}
										className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-8 backdrop-blur-xl transition-all hover:border-emerald-500/50"
									>
										<div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
										<div className="relative flex flex-col items-center gap-4 text-center">
											<div className="rounded-2xl bg-white/5 p-4 transition-colors group-hover:bg-emerald-500/10">
												<Icon className="h-7 w-7 text-white/70 transition-colors group-hover:text-emerald-400" />
											</div>
											<div>
												<div className="font-semibold capitalize text-white">{name}</div>
												<div className="mt-1 text-sm text-white/40">
													{counts[name] ?? '—'} product{counts[name] === 1 ? '' : 's'}
												</div>
											</div>
										</div>
									</Link>
								</motion.div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

export default CategoriesPage
