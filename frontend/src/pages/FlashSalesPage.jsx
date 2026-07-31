import { useState } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import FlashSaleCard from '../components/FlashSaleCard'
import AuthModal from '../components/AuthModal'
import { useFlashSales } from '../hooks/useFlashSales'

const FlashSalesPage = () => {
	const { sales, isLoading, error, refresh } = useFlashSales()
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<div className="mb-12 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 p-3">
						<Zap className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">Flash sales</h1>
						<p className="mt-1 text-white/50">Limited stock, limited time. One per customer.</p>
					</div>
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error.message}</p>
				)}

				{isLoading ? (
					<div className="flex items-center gap-3 text-white/50">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading drops...
					</div>
				) : sales.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						No flash sales are live right now. Check back soon.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{sales.map((sale, index) => (
							<FlashSaleCard
								key={sale.id}
								sale={sale}
								index={index}
								onRequireAuth={() => setIsAuthModalOpen(true)}
								onCheckout={refresh}
							/>
						))}
					</div>
				)}
			</div>

			{isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
		</div>
	)
}

export default FlashSalesPage
