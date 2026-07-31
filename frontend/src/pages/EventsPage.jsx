import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Ticket, Loader2, MapPin, Calendar, Film, Trophy, Music, Drama } from 'lucide-react'
import { events as eventsApi } from '../lib/api'

const TYPES = [
	{ value: '', label: 'All', Icon: Ticket },
	{ value: 'movie', label: 'Movies', Icon: Film },
	{ value: 'sports', label: 'Sports', Icon: Trophy },
	{ value: 'concert', label: 'Concerts', Icon: Music },
	{ value: 'theatre', label: 'Theatre', Icon: Drama },
]

const typeIcon = (type) => TYPES.find((t) => t.value === type)?.Icon || Ticket

const EventsPage = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const type = searchParams.get('type') || ''

	const [events, setEvents] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		setIsLoading(true)
		eventsApi
			.list({ type: type || undefined })
			.then((data) => {
				setEvents(data || [])
				setError(null)
			})
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false))
	}, [type])

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-7xl px-6">
				<div className="mb-10 flex items-center gap-3">
					<div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 p-3">
						<Ticket className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold text-white">Events</h1>
						<p className="mt-1 text-white/50">Movies, sports and live shows. Pick your seats.</p>
					</div>
				</div>

				<div className="mb-12 flex flex-wrap gap-3">
					{TYPES.map(({ value, label, Icon }) => (
						<button
							key={label}
							onClick={() => {
								const params = new URLSearchParams()
								if (value) params.set('type', value)
								setSearchParams(params)
							}}
							className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all ${
								type === value
									? 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300'
									: 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
							}`}
						>
							<Icon className="h-4 w-4" />
							{label}
						</button>
					))}
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				{isLoading ? (
					<div className="flex items-center gap-3 text-white/50">
						<Loader2 className="h-5 w-5 animate-spin" />
						Loading events...
					</div>
				) : events.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-white/50">
						No events listed yet. Sellers can create one from the Sell dashboard.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{events.map((event, index) => {
							const Icon = typeIcon(event.type)
							const soldOut = event.availableSeats === 0
							const started = new Date(event.startTime) <= new Date()

							return (
								<motion.div
									key={event._id}
									initial={{ opacity: 0, y: 24 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									whileHover={{ y: -8 }}
								>
									<Link
										to={`/events/${event._id}`}
										className="group block overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl transition-all hover:border-fuchsia-500/50"
									>
										<div className="relative h-52 overflow-hidden bg-zinc-800">
											{event.posterImage ? (
												<img
													src={event.posterImage}
													alt={event.title}
													className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
												/>
											) : (
												<div className="flex h-full items-center justify-center bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20">
													<Icon className="h-12 w-12 text-white/30" />
												</div>
											)}
											<span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-xl">
												<Icon className="h-3.5 w-3.5" />
												{event.type}
											</span>
											{(soldOut || started) && (
												<span className="absolute right-4 top-4 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white">
													{started ? 'Started' : 'Sold out'}
												</span>
											)}
										</div>

										<div className="p-5">
											<h3 className="truncate text-lg font-bold text-white group-hover:text-fuchsia-300">
												{event.title}
											</h3>
											<div className="mt-3 flex items-center gap-2 text-sm text-white/50">
												<MapPin className="h-4 w-4 shrink-0" />
												<span className="truncate">
													{event.venue}
													{event.city ? `, ${event.city}` : ''}
												</span>
											</div>
											<div className="mt-2 flex items-center gap-2 text-sm text-white/50">
												<Calendar className="h-4 w-4 shrink-0" />
												{new Date(event.startTime).toLocaleString('en-IN', {
													dateStyle: 'medium',
													timeStyle: 'short',
												})}
											</div>
											<div className="mt-4 border-t border-white/10 pt-3 text-sm">
												<span className={soldOut ? 'text-red-400' : 'text-emerald-400'}>
													{event.availableSeats} of {event.totalSeats} seats free
												</span>
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

export default EventsPage
