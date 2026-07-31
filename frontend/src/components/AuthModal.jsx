import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const AuthModal = ({ onClose }) => {
	const { login, register } = useAuth()
	const [mode, setMode] = useState('login')
	const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' })
	const [error, setError] = useState(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const isRegister = mode === 'register'

	const handleChange = (field) => (event) => setForm({ ...form, [field]: event.target.value })

	const handleSubmit = async (event) => {
		event.preventDefault()
		setIsSubmitting(true)
		setError(null)

		try {
			if (isRegister) {
				await register(form)
			} else {
				await login({ email: form.email, password: form.password })
			}
			onClose()
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.97 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
			>
				<button
					onClick={onClose}
					className="absolute top-5 right-5 rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
				>
					<X className="h-5 w-5" />
				</button>

				<h2 className="text-2xl font-bold text-white">
					{isRegister ? 'Create your account' : 'Welcome back'}
				</h2>
				<p className="mt-2 text-sm text-white/50">
					{isRegister ? 'Sign up to grab limited drops.' : 'Sign in to add items and check out.'}
				</p>

				<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
					{isRegister && (
						<>
							<input
								type="text"
								required
								placeholder="Full name"
								value={form.name}
								onChange={handleChange('name')}
								className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
							/>

							<div>
								<p className="mb-2 text-sm text-white/50">I want to</p>
								<div className="grid grid-cols-2 gap-3">
									{[
										{ value: 'buyer', label: 'Buy', hint: 'Shop drops and flash sales' },
										{ value: 'seller', label: 'Sell', hint: 'List products of my own' },
									].map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => setForm({ ...form, role: option.value })}
											className={`rounded-2xl border p-4 text-left transition-all ${
												form.role === option.value
													? 'border-emerald-500/60 bg-emerald-500/10'
													: 'border-white/10 bg-white/5 hover:border-white/20'
											}`}
										>
											<div className="font-semibold text-white">{option.label}</div>
											<div className="mt-1 text-xs leading-snug text-white/45">{option.hint}</div>
										</button>
									))}
								</div>
							</div>
						</>
					)}

					<input
						type="email"
						required
						placeholder="Email"
						value={form.email}
						onChange={handleChange('email')}
						className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
					/>

					<input
						type="password"
						required
						minLength={6}
						placeholder="Password"
						value={form.password}
						onChange={handleChange('password')}
						className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/60 focus:outline-none"
					/>

					{error && (
						<p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
							{error}
						</p>
					)}

					<motion.button
						type="submit"
						disabled={isSubmitting}
						whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
						whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
						className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-semibold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-colors hover:bg-emerald-400 disabled:opacity-60"
					>
						{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
						{isRegister ? 'Create account' : 'Sign in'}
					</motion.button>
				</form>

				<button
					onClick={() => {
						setMode(isRegister ? 'login' : 'register')
						setError(null)
					}}
					className="mt-6 w-full text-center text-sm text-white/50 transition-colors hover:text-emerald-400"
				>
					{isRegister ? 'Already have an account? Sign in' : "New here? Create an account"}
				</button>
			</motion.div>
		</div>
	)
}

export default AuthModal
