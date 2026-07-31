import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, ClipboardCheck, ArrowLeft, Loader2, Check } from 'lucide-react'
import { orders as ordersApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import PaymentForm from '../components/PaymentForm'

const STEPS = [
	{ key: 'address', label: 'Address', Icon: MapPin },
	{ key: 'payment', label: 'Payment', Icon: CreditCard },
	{ key: 'review', label: 'Review', Icon: ClipboardCheck },
]

const ADDRESS_KEY = 'dropcart.address'
const EMPTY_ADDRESS = {
	fullName: '',
	phone: '',
	line1: '',
	line2: '',
	city: '',
	state: '',
	pincode: '',
	country: 'India',
}

const field =
	'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none'

const CheckoutPage = () => {
	const navigate = useNavigate()
	const { isAuthenticated, isLoading: authLoading } = useAuth()
	const { items, subtotal, totalItems, isLoading, refresh } = useCart()

	const [step, setStep] = useState('address')
	const [address, setAddress] = useState(() => {
		try {
			return { ...EMPTY_ADDRESS, ...JSON.parse(localStorage.getItem(ADDRESS_KEY) || '{}') }
		} catch {
			return EMPTY_ADDRESS
		}
	})
	const [payment, setPayment] = useState(null)
	const [errors, setErrors] = useState({})
	const [isPlacing, setIsPlacing] = useState(false)
	const [error, setError] = useState(null)

	const delivery = subtotal >= 999 ? 0 : 49
	const total = subtotal + delivery

	useEffect(() => {
		if (!authLoading && !isLoading && items.length === 0 && !isPlacing) {
			navigate('/cart')
		}
	}, [authLoading, isLoading, items.length, isPlacing, navigate])

	const handleAddressSubmit = (event) => {
		event.preventDefault()
		const next = {}

		if (!address.fullName.trim()) next.fullName = 'Required'
		if (!/^\d{10}$/.test(address.phone.replace(/\D/g, ''))) next.phone = 'Enter a 10 digit phone number'
		if (!address.line1.trim()) next.line1 = 'Required'
		if (!address.city.trim()) next.city = 'Required'
		if (!address.state.trim()) next.state = 'Required'
		if (!/^\d{6}$/.test(address.pincode.trim())) next.pincode = 'Enter a 6 digit pincode'

		setErrors(next)
		if (Object.keys(next).length) return

		// Remembered locally so a repeat purchase doesn't retype it.
		localStorage.setItem(ADDRESS_KEY, JSON.stringify(address))
		setStep('payment')
	}

	const handlePaymentSubmit = (safePayment) => {
		setPayment(safePayment)
		setStep('review')
	}

	const placeOrder = async () => {
		setIsPlacing(true)
		setError(null)
		try {
			const order = await ordersApi.placeFromCart({ shippingAddress: address, payment })
			await refresh()
			navigate(`/orders?placed=${order._id}`)
		} catch (err) {
			setError(err.message)
			await refresh()
			setIsPlacing(false)
		}
	}

	if (authLoading || isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white/50">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		)
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
				<h1 className="text-3xl font-bold text-white">Sign in to check out</h1>
				<Link to="/" className="mt-2 rounded-full bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10">
					Back to shop
				</Link>
			</div>
		)
	}

	const stepIndex = STEPS.findIndex((s) => s.key === step)

	return (
		<div className="min-h-screen bg-zinc-950 pb-24 pt-28">
			<div className="mx-auto max-w-6xl px-6">
				<Link to="/cart" className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400">
					<ArrowLeft className="h-4 w-4" />
					Back to cart
				</Link>

				<h1 className="mb-8 text-4xl font-bold text-white">Checkout</h1>

				{/* Stepper */}
				<div className="mb-12 flex items-center gap-3">
					{STEPS.map((s, index) => {
						const done = index < stepIndex
						const active = index === stepIndex
						return (
							<div key={s.key} className="flex flex-1 items-center gap-3">
								<div
									className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
										active
											? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
											: done
												? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400/70'
												: 'border-white/10 bg-white/5 text-white/40'
									}`}
								>
									{done ? <Check className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}
									{s.label}
								</div>
								{index < STEPS.length - 1 && (
									<div className={`h-px flex-1 ${done ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
								)}
							</div>
						)
					})}
				</div>

				{error && (
					<p className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">{error}</p>
				)}

				<div className="grid gap-10 lg:grid-cols-[1fr_340px]">
					<motion.div
						key={step}
						initial={{ opacity: 0, x: 16 }}
						animate={{ opacity: 1, x: 0 }}
						className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 backdrop-blur-xl"
					>
						{step === 'address' && (
							<form onSubmit={handleAddressSubmit} className="flex flex-col gap-4">
								<h2 className="text-xl font-bold text-white">Delivery address</h2>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<input
											placeholder="Full name"
											value={address.fullName}
											onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
											className={field}
										/>
										{errors.fullName && <p className="mt-1 px-1 text-xs text-red-400">{errors.fullName}</p>}
									</div>
									<div>
										<input
											inputMode="numeric"
											placeholder="Phone"
											value={address.phone}
											onChange={(e) => setAddress({ ...address, phone: e.target.value })}
											className={field}
										/>
										{errors.phone && <p className="mt-1 px-1 text-xs text-red-400">{errors.phone}</p>}
									</div>
								</div>

								<div>
									<input
										placeholder="Flat / house no, building, street"
										value={address.line1}
										onChange={(e) => setAddress({ ...address, line1: e.target.value })}
										className={field}
									/>
									{errors.line1 && <p className="mt-1 px-1 text-xs text-red-400">{errors.line1}</p>}
								</div>

								<input
									placeholder="Area, landmark (optional)"
									value={address.line2}
									onChange={(e) => setAddress({ ...address, line2: e.target.value })}
									className={field}
								/>

								<div className="grid grid-cols-3 gap-4">
									<div>
										<input
											placeholder="City"
											value={address.city}
											onChange={(e) => setAddress({ ...address, city: e.target.value })}
											className={field}
										/>
										{errors.city && <p className="mt-1 px-1 text-xs text-red-400">{errors.city}</p>}
									</div>
									<div>
										<input
											placeholder="State"
											value={address.state}
											onChange={(e) => setAddress({ ...address, state: e.target.value })}
											className={field}
										/>
										{errors.state && <p className="mt-1 px-1 text-xs text-red-400">{errors.state}</p>}
									</div>
									<div>
										<input
											inputMode="numeric"
											placeholder="Pincode"
											value={address.pincode}
											onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
											className={field}
										/>
										{errors.pincode && <p className="mt-1 px-1 text-xs text-red-400">{errors.pincode}</p>}
									</div>
								</div>

								<button
									type="submit"
									className="mt-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400"
								>
									Continue to payment
								</button>
							</form>
						)}

						{step === 'payment' && (
							<div>
								<h2 className="mb-6 text-xl font-bold text-white">Payment</h2>
								<PaymentForm onSubmit={handlePaymentSubmit} submitLabel="Review order" />
								<button
									onClick={() => setStep('address')}
									className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/60 hover:bg-white/10"
								>
									Back to address
								</button>
							</div>
						)}

						{step === 'review' && (
							<div className="flex flex-col gap-6">
								<h2 className="text-xl font-bold text-white">Review and confirm</h2>

								<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs font-bold uppercase tracking-wider text-white/35">Delivering to</span>
										<button onClick={() => setStep('address')} className="text-xs text-emerald-400 hover:underline">
											Change
										</button>
									</div>
									<p className="font-semibold text-white">{address.fullName}</p>
									<p className="mt-1 text-sm text-white/55">
										{[address.line1, address.line2, address.city, address.state, address.pincode]
											.filter(Boolean)
											.join(', ')}
									</p>
									<p className="mt-1 text-sm text-white/40">{address.phone}</p>
								</div>

								<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
									<div className="mb-2 flex items-center justify-between">
										<span className="text-xs font-bold uppercase tracking-wider text-white/35">Paying with</span>
										<button onClick={() => setStep('payment')} className="text-xs text-emerald-400 hover:underline">
											Change
										</button>
									</div>
									{payment?.method === 'card' && (
										<p className="font-mono font-semibold text-white">
											{payment.cardBrand} •••• {payment.last4}
											<span className="ml-3 font-sans text-sm text-white/40">
												{payment.expiryMonth}/{String(payment.expiryYear).slice(-2)}
											</span>
										</p>
									)}
									{payment?.method === 'upi' && <p className="font-semibold text-white">UPI · {payment.upiId}</p>}
									{payment?.method === 'cod' && <p className="font-semibold text-white">Cash on delivery</p>}
								</div>

								<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
									<span className="text-xs font-bold uppercase tracking-wider text-white/35">Items</span>
									<div className="mt-3 flex flex-col gap-3">
										{items.map((item) => (
											<div key={item.product?._id} className="flex items-center gap-3">
												<div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
													{item.product?.images?.[0] && (
														<img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
													)}
												</div>
												<span className="min-w-0 flex-1 truncate text-sm text-white/70">{item.product?.name}</span>
												<span className="text-sm text-white/40">× {item.quantity}</span>
												<span className="text-sm text-white/60">
													₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
												</span>
											</div>
										))}
									</div>
								</div>

								<button
									onClick={placeOrder}
									disabled={isPlacing}
									className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
								>
									{isPlacing && <Loader2 className="h-4 w-4 animate-spin" />}
									{isPlacing ? 'Placing order...' : `Place order · ₹${total.toLocaleString('en-IN')}`}
								</button>
							</div>
						)}
					</motion.div>

					{/* Summary */}
					<div className="h-fit rounded-3xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl lg:sticky lg:top-28">
						<h2 className="mb-5 text-lg font-bold text-white">Summary</h2>
						<div className="flex flex-col gap-3 text-sm">
							<div className="flex justify-between text-white/60">
								<span>Items</span>
								<span>{totalItems}</span>
							</div>
							<div className="flex justify-between text-white/60">
								<span>Subtotal</span>
								<span>₹{subtotal.toLocaleString('en-IN')}</span>
							</div>
							<div className="flex justify-between text-white/60">
								<span>Delivery</span>
								<span className="text-emerald-400">{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
							</div>
							<div className="mt-3 flex justify-between border-t border-white/10 pt-4 text-lg font-bold text-white">
								<span>Total</span>
								<span>₹{total.toLocaleString('en-IN')}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CheckoutPage
