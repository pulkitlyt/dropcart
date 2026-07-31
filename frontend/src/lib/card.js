// Card helpers. Everything here runs in the browser only — the full number and
// CVV are used for validation and formatting, then discarded. Only the brand,
// last4 and expiry are ever sent to the server.

const BRANDS = [
	{ name: 'Visa', pattern: /^4/, lengths: [16], cvv: 3 },
	{ name: 'Mastercard', pattern: /^(5[1-5]|2[2-7])/, lengths: [16], cvv: 3 },
	{ name: 'Amex', pattern: /^3[47]/, lengths: [15], cvv: 4 },
	{ name: 'RuPay', pattern: /^(60|65|81|82)/, lengths: [16], cvv: 3 },
	{ name: 'Discover', pattern: /^6(?:011|5)/, lengths: [16], cvv: 3 },
]

export const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

export const detectBrand = (number) => {
	const digits = digitsOnly(number)
	return BRANDS.find((brand) => brand.pattern.test(digits)) || null
}

// Amex groups 4-6-5; everything else groups in fours.
export const formatCardNumber = (value) => {
	const digits = digitsOnly(value)
	const brand = detectBrand(digits)
	const groups = brand?.name === 'Amex' ? [4, 6, 5] : [4, 4, 4, 4]

	const parts = []
	let index = 0
	for (const size of groups) {
		if (index >= digits.length) break
		parts.push(digits.slice(index, index + size))
		index += size
	}
	return parts.join(' ')
}

export const formatExpiry = (value) => {
	const digits = digitsOnly(value).slice(0, 4)
	if (digits.length <= 2) return digits
	return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

// Standard Luhn checksum — catches typos and obviously fake numbers.
export const passesLuhn = (number) => {
	const digits = digitsOnly(number)
	if (digits.length < 12) return false

	let sum = 0
	let double = false
	for (let i = digits.length - 1; i >= 0; i -= 1) {
		let digit = Number(digits[i])
		if (double) {
			digit *= 2
			if (digit > 9) digit -= 9
		}
		sum += digit
		double = !double
	}
	return sum % 10 === 0
}

export const validateCard = ({ number, expiry, cvv, name }) => {
	const errors = {}
	const digits = digitsOnly(number)
	const brand = detectBrand(digits)

	if (!name?.trim()) errors.name = 'Enter the name on the card'

	if (!digits) errors.number = 'Enter a card number'
	else if (!brand) errors.number = 'Unrecognised card type'
	else if (!brand.lengths.includes(digits.length)) errors.number = `${brand.name} numbers are ${brand.lengths[0]} digits`
	else if (!passesLuhn(digits)) errors.number = 'That card number is not valid'

	const [rawMonth, rawYear] = String(expiry || '').split('/')
	const month = Number(rawMonth)
	const year = Number(rawYear)

	if (!rawMonth || !rawYear || rawYear.length !== 2) {
		errors.expiry = 'Use MM/YY'
	} else if (!(month >= 1 && month <= 12)) {
		errors.expiry = 'Month must be 01-12'
	} else {
		const now = new Date()
		const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59)
		if (expiryDate < now) errors.expiry = 'That card has expired'
	}

	const expectedCvv = brand?.cvv ?? 3
	if (digitsOnly(cvv).length !== expectedCvv) {
		errors.cvv = `CVV must be ${expectedCvv} digits`
	}

	return { errors, isValid: Object.keys(errors).length === 0, brand }
}

/** Reduces a validated card to the only fields safe to transmit and store. */
export const toSafePayload = ({ number, expiry, name }) => {
	const digits = digitsOnly(number)
	const [month, year] = String(expiry).split('/')

	return {
		method: 'card',
		cardBrand: detectBrand(digits)?.name || 'Card',
		last4: digits.slice(-4),
		expiryMonth: month,
		expiryYear: `20${year}`,
		nameOnCard: name.trim(),
	}
}
