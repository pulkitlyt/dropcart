import { ApiError } from './ApiError.js'

const REQUIRED_ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']

const parseAddress = (address) => {
	if (!address || typeof address !== 'object') {
		throw new ApiError(400, 'A shipping address is required')
	}

	const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !String(address[field] || '').trim())
	if (missing.length) {
		throw new ApiError(400, `Missing address fields: ${missing.join(', ')}`)
	}

	if (!/^\d{6}$/.test(String(address.pincode).trim())) {
		throw new ApiError(400, 'Pincode must be 6 digits')
	}

	if (!/^\d{10}$/.test(String(address.phone).replace(/\D/g, '').slice(-10))) {
		throw new ApiError(400, 'Phone must be 10 digits')
	}

	return {
		fullName: String(address.fullName).trim(),
		phone: String(address.phone).trim(),
		line1: String(address.line1).trim(),
		line2: String(address.line2 || '').trim(),
		city: String(address.city).trim(),
		state: String(address.state).trim(),
		pincode: String(address.pincode).trim(),
		country: String(address.country || 'India').trim(),
	}
}

/**
 * Accepts only non-sensitive payment metadata. A full card number or CVV is
 * rejected outright rather than quietly dropped — if a client ever starts
 * sending them, that should fail loudly instead of silently persisting.
 */
const parsePayment = (payment) => {
	if (!payment || typeof payment !== 'object') {
		throw new ApiError(400, 'Payment details are required')
	}

	const forbidden = ['cardNumber', 'number', 'pan', 'cvv', 'cvc', 'securityCode']
	const offending = forbidden.filter((key) => payment[key] !== undefined)
	if (offending.length) {
		throw new ApiError(400, `Do not send raw card data (${offending.join(', ')}); send brand and last4 only`)
	}

	const method = ['card', 'upi', 'cod'].includes(payment.method) ? payment.method : 'card'

	if (method === 'card') {
		if (!/^\d{4}$/.test(String(payment.last4 || ''))) {
			throw new ApiError(400, 'last4 must be 4 digits')
		}
		return {
			method,
			cardBrand: String(payment.cardBrand || 'Card').slice(0, 20),
			last4: String(payment.last4),
			expiryMonth: String(payment.expiryMonth || '').slice(0, 2),
			expiryYear: String(payment.expiryYear || '').slice(0, 4),
			nameOnCard: String(payment.nameOnCard || '').slice(0, 80),
		}
	}

	if (method === 'upi') {
		if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(payment.upiId || ''))) {
			throw new ApiError(400, 'Enter a valid UPI id')
		}
		return { method, upiId: String(payment.upiId) }
	}

	return { method: 'cod' }
}

export { parseAddress, parsePayment }
