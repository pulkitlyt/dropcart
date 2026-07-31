import { motion } from 'framer-motion'

const LEGEND = [
	{ label: 'Available', className: 'bg-white/10 border-white/20' },
	{ label: 'Premium', className: 'bg-amber-500/20 border-amber-500/40' },
	{ label: 'Selected', className: 'bg-emerald-500 border-emerald-400' },
	{ label: 'Held by you', className: 'bg-emerald-500/40 border-emerald-400/60' },
	{ label: 'Taken', className: 'bg-zinc-800 border-white/5' },
]

const seatClasses = ({ seat, isSelected, isHeldByMe }) => {
	if (seat.status === 'booked') return 'bg-zinc-800 border-white/5 text-white/20 cursor-not-allowed'
	if (isSelected) return 'bg-emerald-500 border-emerald-400 text-white'
	if (isHeldByMe) return 'bg-emerald-500/40 border-emerald-400/60 text-white'
	// Someone else's live hold — unavailable, but visually distinct from booked.
	if (seat.status === 'held') return 'bg-zinc-800 border-white/5 text-white/20 cursor-not-allowed'
	if (seat.tier === 'premium') return 'bg-amber-500/20 border-amber-500/40 text-amber-100 hover:border-amber-400'
	return 'bg-white/10 border-white/20 text-white/70 hover:border-emerald-400/60'
}

const SeatMap = ({ seats, selectedIds, onToggle, disabled }) => {
	// Group into rows, preserving seat order within each.
	const rows = seats.reduce((acc, seat) => {
		;(acc[seat.row] ||= []).push(seat)
		return acc
	}, {})

	return (
		<div>
			{/* Screen / stage marker */}
			<div className="mb-10">
				<div className="mx-auto h-2 w-3/4 rounded-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
				<p className="mt-3 text-center text-xs uppercase tracking-[0.4em] text-white/30">Screen / stage</p>
			</div>

			<div className="flex flex-col items-center gap-2 overflow-x-auto pb-4">
				{Object.entries(rows).map(([row, rowSeats]) => (
					<div key={row} className="flex items-center gap-2">
						<span className="w-6 shrink-0 text-center text-xs font-bold text-white/30">{row}</span>
						<div className="flex gap-2">
							{rowSeats.map((seat) => {
								const isSelected = selectedIds.includes(seat._id)
								const isHeldByMe = seat.mine && seat.status === 'held'
								const isTaken = seat.status === 'booked' || (seat.status === 'held' && !seat.mine)

								return (
									<motion.button
										key={seat._id}
										whileHover={isTaken || disabled ? {} : { scale: 1.15 }}
										whileTap={isTaken || disabled ? {} : { scale: 0.92 }}
										onClick={() => !isTaken && !disabled && onToggle(seat)}
										disabled={isTaken || disabled}
										title={`${seat.label} · ${seat.tier} · ₹${seat.price}`}
										className={`h-8 w-8 shrink-0 rounded-lg border text-[10px] font-bold transition-colors ${seatClasses({
											seat,
											isSelected,
											isHeldByMe,
										})}`}
									>
										{seat.number}
									</motion.button>
								)
							})}
						</div>
					</div>
				))}
			</div>

			<div className="mt-8 flex flex-wrap justify-center gap-5">
				{LEGEND.map((item) => (
					<div key={item.label} className="flex items-center gap-2">
						<span className={`h-4 w-4 rounded border ${item.className}`} />
						<span className="text-xs text-white/50">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default SeatMap
