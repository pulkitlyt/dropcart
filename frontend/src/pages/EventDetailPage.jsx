import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft, MapPin, Calendar, Timer, Ticket, Check } from 'lucide-react'
import { events as eventsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import SeatMap from '../components/SeatMap'
import PaymentForm from '../components/PaymentForm'
import AuthModal from '../components/AuthModal'

const formatCountdown = (ms) => {
	const total = Math.max(0, Math.floor(ms / 1000))
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const EventDetailPage = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { isAuthenticated, isLoading: authLoading } = useAuth()

	const [event, setEvent] = useState(null)
	const [seats, setSeats] = useState([])
	const [selected, setSelected] = useState([])
	const [hold, setHold] = useState(null)
	const [remainingMs, setRemainingMs] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [busy, setBusy] = useState(null)
	const [error, setError] = useState(null)
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
	const [showPayment, setShowPayment] = useState(false)
	const holdRef = useRef(null)

	const loadSeats = useCallback(async () => {
		const data = await eventsApi.seats(id)
		setSeats(data || [])
		return data
	}, [id])

	useEffect(() => {
		Promise.all([eventsApi.get(id), loadSeats()])
			.then(([eventData]) => {
				setEvent(eventData)
				setError(null)
			})
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false))
	}, [id, loadSeats])

	// Countdown for an active hold. When it hits zero the seats are already
	// free server-side (holds expire by timestamp), so just resync.
	useEffect(() => {
		if (!hold) return undefined

		const tick = () => {
			const left = new Date(hold.holdExpiresAt) - new Date()
			setRemainingMs(left)

			if (left <= 0) {
				setHold(null)
				setSelected([])
				setError('Your seat hold expired. Please pick your seats again.')
				loadSeats()
			}
		}

		tick()
		const timer = setInterval(tick, 1000)
		return () => clearInterval(timer)
	}, [hold, loadSeats])

	// Best-effort release if the user navigates away mid-hold, so seats don't
	// sit locked for the full window. Expiry is still the real guarantee.
	useEffect(() => {
		holdRef.current = hold
	}, [hold])

	useEffect(
		() => () => {
			if (holdRef.current) eventsApi.release(id).catch(() => {})
		},
		[id],
	)

	const toggleSeat = (seat) => {
		if (hold) return
		setSelected((current) =>
			current.includes(seat._id) ? current.filter((s) => s !== seat._id) : [...current, seat._id],
		)
	}

	const handleHold = async () => {
		if (!isAuthenticated) {
			setIsAuthModalOpen(true)
			return
		}

		setBusy('holding')
		setError(null)
		try {
			const result = await eventsApi.hold(id, selected)
			setHold(result)
			await loadSeats()
		} catch (err) {
			setError(err.message)
			setSelected([])
			await loadSeats()
		} finally {
			setBusy(null)
		}
	}

	const handleRelease = async () => {
		setBusy('releasing')
		try {
			await eventsApi.release(id)
			setHold(null)
			setSelected([])
			await loadSeats()
		} catch (err) {
			setError(err.message)
		} finally {
			setBusy(null)
		}
	}

	const handleBook = async (payment) => {
		setBusy('booking')
		setError(null)
		try {
			const order = await eventsApi.book(id, { payment })
			setHold(null)
			setSelected([])
			setShowPayment(false)
			navigate(`/orders?placed=${order._id}`)
		} catch (err) {
			setError(err.message)
			setHold(null)
			setSelected([])
			setShowPayment(false)
			await loadSeats()
		} finally {
			setBusy(null)
		}
	}

	if (isLoading || authLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/50">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!event) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
				<h1 className="text-3xl font-bold text-white">Event not found</h1>
				{error && <p className="text-white/50">{error}</p>}
				<Link to="/events" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					All events
				</Link>
			</div>
		)
	}

	const selectedSeats = seats.filter((seat) => selected.includes(seat._id))
	const heldSeats = hold?.seats || []
	const activeSeats = hold ? heldSeats : selectedSeats
	const total = hold ? hold.totalAmount : selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
	const hasStarted = new Date(event.startTime) <= new Date()

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<Link to="/events" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-fuchsia-400">
					<ArrowLeft className="h-4 w-4" />
					All events
				</Link>

				{/* Header */}
				<div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div>
						<span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-fuchsia-300">
							{event.type}
						</span>
						<h1 className="mt-4 text-4xl font-black text-white md:text-5xl">{event.title}</h1>
						{event.description && <p className="mt-3 max-w-2xl text-white/60">{event.description}</p>}
						<div className="mt-5 flex flex-wrap gap-6 text-sm text-white/50">
							<span className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								{event.venue}
								{event.city ? `, ${event.city}` : ''}
							</span>
							<span className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								{new Date(event.startTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
							</span>
						</div>
					</div>
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				{hasStarted ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						This event has already started. Booking is closed.
					</div>
				) : (
					<div className="grid gap-10 lg:grid-cols-[1fr_340px]">
						<div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
							<SeatMap seats={seats} selectedIds={selected} onToggle={toggleSeat} disabled={Boolean(hold)} />
						</div>

						{/* Summary panel */}
						<div className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl lg:sticky lg:top-28">
							<h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
								<Ticket className="h-5 w-5 text-fuchsia-400" />
								Your seats
							</h2>

							{hold && (
								<div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
									<span className="flex items-center gap-2 text-sm text-amber-200">
										<Timer className="h-4 w-4" />
										Held for
									</span>
									<span className="font-mono text-lg font-bold text-amber-200">
										{formatCountdown(remainingMs)}
									</span>
								</div>
							)}

							{activeSeats.length === 0 ? (
								<p className="text-sm text-white/40">
									Tap seats on the map to select them, then reserve to lock them for 5 minutes.
								</p>
							) : (
								<div className="flex flex-col gap-2">
									{activeSeats.map((seat) => (
										<div key={seat._id} className="flex justify-between text-sm">
											<span className="text-white/70">
												{seat.label}
												<span className="ml-2 text-xs capitalize text-white/35">{seat.tier}</span>
											</span>
											<span className="text-white/60">₹{seat.price?.toLocaleString('en-IN')}</span>
										</div>
									))}
									<div className="mt-3 flex justify-between border-t border-white/10 pt-4 text-lg font-bold text-white">
										<span>Total</span>
										<span className="text-fuchsia-300">₹{total.toLocaleString('en-IN')}</span>
									</div>
								</div>
							)}

							{!hold ? (
								<motion.button
									onClick={handleHold}
									disabled={selected.length === 0 || busy === 'holding'}
									whileHover={{ scale: selected.length ? 1.02 : 1 }}
									whileTap={{ scale: selected.length ? 0.98 : 1 }}
									className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(217,70,239,0.35)] transition-colors hover:bg-fuchsia-400 disabled:opacity-40 disabled:shadow-none"
								>
									{busy === 'holding' && <Loader2 className="h-4 w-4 animate-spin" />}
									Reserve {selected.length > 0 ? `${selected.length} seat${selected.length > 1 ? 's' : ''}` : 'seats'}
								</motion.button>
							) : (
								<div className="mt-6 flex flex-col gap-3">
									<motion.button
										onClick={() => setShowPayment(true)}
										disabled={busy === 'booking'}
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
									>
										{busy === 'booking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
										Confirm & pay
									</motion.button>
									<button
										onClick={handleRelease}
										disabled={busy === 'releasing'}
										className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10"
									>
										Release seats
									</button>
								</div>
							)}

							{showPayment && (
								<div className="mt-6 border-t border-white/10 pt-6">
									<h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/40">Payment</h3>
									<PaymentForm
										methods={['card', 'upi']}
										onSubmit={handleBook}
										submitting={busy === 'booking'}
										submitLabel={`Pay ₹${total.toLocaleString('en-IN')}`}
									/>
								</div>
							)}

							<p className="mt-4 text-center text-xs text-white/30">
								Seats are locked the moment you reserve, and released automatically if you don't pay in time.
							</p>
						</div>
					</div>
				)}
			</div>

			{isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
		</div>
	)
}

export default EventDetailPage
