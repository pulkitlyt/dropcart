import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Loader2, BadgeCheck, Trash2, PenLine } from 'lucide-react'
import { products as productsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const StarRow = ({ value, size = 'h-4 w-4', onPick }) =>
	[...Array(5)].map((_, i) => {
		const filled = i < Math.round(value)
		const star = (
			<Star
				key={i}
				className={`${size} transition-colors ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
			/>
		)
		return onPick ? (
			<button key={i} type="button" onClick={() => onPick(i + 1)} className="transition-transform hover:scale-125">
				{star}
			</button>
		) : (
			star
		)
	})

const ProductReviews = ({ productId, onRatingChange, onRequireAuth }) => {
	const { isAuthenticated, user } = useAuth()
	const [data, setData] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [form, setForm] = useState({ rating: 0, title: '', comment: '' })
	const [isWriting, setIsWriting] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState(null)

	const load = useCallback(async () => {
		try {
			const result = await productsApi.reviews(productId)
			setData(result)
			onRatingChange?.(result.ratingAverage, result.ratingCount)
			if (result.myReview) {
				setForm({
					rating: result.myReview.rating,
					title: result.myReview.title || '',
					comment: result.myReview.comment || '',
				})
			}
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}, [productId, onRatingChange])

	useEffect(() => {
		load()
	}, [load])

	const submit = async (event) => {
		event.preventDefault()
		if (!form.rating) {
			setError('Pick a star rating first')
			return
		}

		setIsSaving(true)
		setError(null)
		try {
			await productsApi.review(productId, form)
			setIsWriting(false)
			await load()
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSaving(false)
		}
	}

	const remove = async (reviewId) => {
		setError(null)
		try {
			await productsApi.deleteReview(reviewId)
			setForm({ rating: 0, title: '', comment: '' })
			await load()
		} catch (err) {
			setError(err.message)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center gap-3 text-white/50">
				<Loader2 className="h-5 w-5 animate-spin" />
				Loading reviews...
			</div>
		)
	}

	const { reviews = [], distribution = [], ratingAverage = 0, ratingCount = 0, myReview } = data || {}

	return (
		<div>
			<h2 className="mb-8 text-2xl font-bold text-white">
				Ratings & reviews
				{ratingCount > 0 && <span className="ml-3 text-base font-normal text-white/40">({ratingCount})</span>}
			</h2>

			{error && (
				<p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300">{error}</p>
			)}

			<div className="grid gap-10 lg:grid-cols-[280px_1fr]">
				{/* Summary */}
				<div className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl">
					{ratingCount === 0 ? (
						<p className="text-sm text-white/40">No ratings yet. Be the first to review this product.</p>
					) : (
						<>
							<div className="mb-4 text-center">
								<div className="text-5xl font-black text-white">{ratingAverage.toFixed(1)}</div>
								<div className="mt-2 flex justify-center gap-1">
									<StarRow value={ratingAverage} />
								</div>
								<p className="mt-2 text-sm text-white/40">
									{ratingCount} rating{ratingCount === 1 ? '' : 's'}
								</p>
							</div>

							<div className="flex flex-col gap-1.5">
								{distribution.map(({ star, count }) => (
									<div key={star} className="flex items-center gap-2 text-xs">
										<span className="w-3 text-white/40">{star}</span>
										<Star className="h-3 w-3 fill-yellow-400/60 text-yellow-400/60" />
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
											<div
												className="h-full rounded-full bg-yellow-400/70"
												style={{ width: `${ratingCount ? (count / ratingCount) * 100 : 0}%` }}
											/>
										</div>
										<span className="w-5 text-right text-white/35">{count}</span>
									</div>
								))}
							</div>
						</>
					)}

					<button
						onClick={() => (isAuthenticated ? setIsWriting((v) => !v) : onRequireAuth?.())}
						className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
					>
						<PenLine className="h-4 w-4" />
						{myReview ? 'Edit your review' : 'Write a review'}
					</button>
				</div>

				{/* List + form */}
				<div>
					{isWriting && (
						<motion.form
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							onSubmit={submit}
							className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
						>
							<div className="flex items-center gap-2">
								<span className="text-sm text-white/50">Your rating</span>
								<div className="flex gap-1">
									<StarRow
										value={form.rating}
										size="h-6 w-6"
										onPick={(rating) => setForm({ ...form, rating })}
									/>
								</div>
							</div>
							<input
								placeholder="Title (optional)"
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>
							<textarea
								rows={3}
								placeholder="What did you think?"
								value={form.comment}
								onChange={(e) => setForm({ ...form, comment: e.target.value })}
								className="resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>
							<div className="flex gap-3">
								<button
									type="submit"
									disabled={isSaving}
									className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
								>
									{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
									{myReview ? 'Update review' : 'Post review'}
								</button>
								{myReview && (
									<button
										type="button"
										onClick={() => remove(myReview._id)}
										className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
							</div>
						</motion.form>
					)}

					{reviews.length === 0 ? (
						<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/40">
							No written reviews yet.
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{reviews.map((review) => (
								<motion.div
									key={review._id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl"
								>
									<div className="mb-2 flex flex-wrap items-center gap-3">
										<div className="flex gap-0.5">
											<StarRow value={review.rating} size="h-3.5 w-3.5" />
										</div>
										<span className="text-sm font-semibold text-white">{review.user?.name || 'Shopper'}</span>
										{review.isVerifiedPurchase && (
											<span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
												<BadgeCheck className="h-3 w-3" />
												Verified purchase
											</span>
										)}
										<span className="ml-auto text-xs text-white/30">
											{new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
										</span>
									</div>
									{review.title && <p className="font-semibold text-white">{review.title}</p>}
									{review.comment && <p className="mt-1 text-sm leading-relaxed text-white/60">{review.comment}</p>}
									{String(review.user?._id) === String(user?._id) && (
										<button
											onClick={() => remove(review._id)}
											className="mt-3 text-xs text-white/30 transition-colors hover:text-red-400"
										>
											Delete my review
										</button>
									)}
								</motion.div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ProductReviews
