import { useState } from 'react'
import { CreditCard, Smartphone, Banknote, ShieldCheck, Lock } from 'lucide-react'
import { formatCardNumber, formatExpiry, digitsOnly, detectBrand, validateCard, toSafePayload } from '../lib/card'

const METHODS = [
	{ value: 'card', label: 'Card', Icon: CreditCard },
	{ value: 'upi', label: 'UPI', Icon: Smartphone },
	{ value: 'cod', label: 'Cash on delivery', Icon: Banknote },
]

const field =
	'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none'

/**
 * Collects payment details and hands back only what's safe to send.
 * The raw number and CVV stay in this component's state and are never lifted
 * out — `onValid` receives brand/last4/expiry only.
 */
const PaymentForm = ({ methods = ['card', 'upi', 'cod'], onSubmit, submitting, submitLabel = 'Pay now' }) => {
	const [method, setMethod] = useState(methods[0])
	const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
	const [upiId, setUpiId] = useState('')
	const [errors, setErrors] = useState({})

	const brand = detectBrand(card.number)
	const available = METHODS.filter((m) => methods.includes(m.value))

	const handleSubmit = (event) => {
		event.preventDefault()

		if (method === 'card') {
			const { errors: cardErrors, isValid } = validateCard(card)
			setErrors(cardErrors)
			if (!isValid) return
			onSubmit(toSafePayload(card))
			return
		}

		if (method === 'upi') {
			if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
				setErrors({ upi: 'Enter a valid UPI id, e.g. name@bank' })
				return
			}
			setErrors({})
			onSubmit({ method: 'upi', upiId: upiId.trim() })
			return
		}

		setErrors({})
		onSubmit({ method: 'cod' })
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<div className="grid grid-cols-3 gap-3">
				{available.map(({ value, label, Icon }) => (
					<button
						key={value}
						type="button"
						onClick={() => {
							setMethod(value)
							setErrors({})
						}}
						className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
							method === value
								? 'border-emerald-500/60 bg-emerald-500/10'
								: 'border-white/10 bg-white/5 hover:border-white/20'
						}`}
					>
						<Icon className={`h-5 w-5 ${method === value ? 'text-emerald-400' : 'text-white/50'}`} />
						<span className="text-xs font-semibold text-white">{label}</span>
					</button>
				))}
			</div>

			{method === 'card' && (
				<div className="flex flex-col gap-3">
					<div>
						<input
							placeholder="Name on card"
							value={card.name}
							onChange={(e) => setCard({ ...card, name: e.target.value })}
							className={field}
						/>
						{errors.name && <p className="mt-1 px-1 text-xs text-red-400">{errors.name}</p>}
					</div>

					<div>
						<div className="relative">
							<input
								inputMode="numeric"
								autoComplete="off"
								placeholder="0000 0000 0000 0000"
								value={formatCardNumber(card.number)}
								onChange={(e) => setCard({ ...card, number: digitsOnly(e.target.value).slice(0, 16) })}
								className={`${field} pr-20 font-mono tracking-wider`}
							/>
							{brand && (
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
									{brand.name}
								</span>
							)}
						</div>
						{errors.number && <p className="mt-1 px-1 text-xs text-red-400">{errors.number}</p>}
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<input
								inputMode="numeric"
								autoComplete="off"
								placeholder="MM/YY"
								value={card.expiry}
								// Normalise on the way into state so what's stored always matches
								// what's displayed. Storing the raw keystrokes instead breaks
								// paste and autofill, which arrive as '1230' with no separator.
								onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
								className={`${field} font-mono`}
							/>
							{errors.expiry && <p className="mt-1 px-1 text-xs text-red-400">{errors.expiry}</p>}
						</div>
						<div>
							<input
								inputMode="numeric"
								autoComplete="off"
								type="password"
								placeholder="CVV"
								value={card.cvv}
								onChange={(e) => setCard({ ...card, cvv: digitsOnly(e.target.value).slice(0, 4) })}
								className={`${field} font-mono`}
							/>
							{errors.cvv && <p className="mt-1 px-1 text-xs text-red-400">{errors.cvv}</p>}
						</div>
					</div>
				</div>
			)}

			{method === 'upi' && (
				<div>
					<input
						placeholder="yourname@bank"
						value={upiId}
						onChange={(e) => setUpiId(e.target.value)}
						className={field}
					/>
					{errors.upi && <p className="mt-1 px-1 text-xs text-red-400">{errors.upi}</p>}
				</div>
			)}

			{method === 'cod' && (
				<p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
					Pay in cash when your order arrives.
				</p>
			)}

			<div className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
				<ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
				<p className="text-xs leading-relaxed text-amber-200/90">
					<span className="font-semibold">Demo checkout — don't enter a real card.</span> No payment is
					processed. Your card number and CVV never leave this browser; only the brand, last 4 digits and
					expiry are saved with the order.
				</p>
			</div>

			<button
				type="submit"
				disabled={submitting}
				className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
			>
				<Lock className="h-4 w-4" />
				{submitting ? 'Processing...' : submitLabel}
			</button>
		</form>
	)
}

export default PaymentForm
