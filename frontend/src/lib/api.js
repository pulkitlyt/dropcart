// In dev, VITE_API_URL is unset and requests hit /api/v1 on the vite dev server,
// which proxies to the express backend on :8000 (see vite.config.js).
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export class ApiError extends Error {
	constructor(message, status, errors = []) {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.errors = errors
	}
}

async function request(path, { method = 'GET', body, headers } = {}) {
	let response
	try {
		response = await fetch(`${API_URL}${path}`, {
			method,
			// The backend authenticates with httpOnly accessToken/refreshToken cookies.
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		})
	} catch {
		throw new ApiError('Cannot reach the server. Is the backend running on port 8000?', 0)
	}

	// Every backend route replies with an ApiResponse/ApiError JSON envelope.
	const payload = await response.json().catch(() => null)

	if (!response.ok) {
		// A non-JSON 5xx means we never reached express — usually the dev proxy
		// erroring because the backend isn't up (or its DB connection failed).
		if (!payload && response.status >= 500) {
			throw new ApiError('Cannot reach the server. Is the backend running on port 8000?', response.status)
		}

		throw new ApiError(payload?.message || response.statusText, response.status, payload?.errors || [])
	}

	return payload?.data
}

const withQuery = (path, params = {}) => {
	const query = new URLSearchParams(
		Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== null),
	).toString()

	return query ? `${path}?${query}` : path
}

export const auth = {
	register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
	login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
	logout: () => request('/auth/logout', { method: 'POST' }),
	me: () => request('/auth/me'),
}

export const products = {
	list: (params) => request(withQuery('/products', params)),
	categories: () => request('/products/categories'),
	mine: () => request('/products/mine'),
	get: (id) => request(`/products/${id}`),
	create: (payload) => request('/products', { method: 'POST', body: payload }),
	reviews: (id) => request(`/products/${id}/reviews`),
	review: (id, payload) => request(`/products/${id}/reviews`, { method: 'POST', body: payload }),
	deleteReview: (reviewId) => request(`/reviews/${reviewId}`, { method: 'DELETE' }),
	update: (id, payload) => request(`/products/${id}`, { method: 'PATCH', body: payload }),
	remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
}

export const cart = {
	get: () => request('/cart'),
	add: (productId, quantity = 1) => request('/cart', { method: 'POST', body: { productId, quantity } }),
	updateQuantity: (productId, quantity) =>
		request(`/cart/${productId}`, { method: 'PATCH', body: { quantity } }),
	remove: (productId) => request(`/cart/${productId}`, { method: 'DELETE' }),
	clear: () => request('/cart', { method: 'DELETE' }),
}

export const events = {
	list: (params) => request(withQuery('/events', params)),
	mine: () => request('/events/mine'),
	get: (id) => request(`/events/${id}`),
	create: (payload) => request('/events', { method: 'POST', body: payload }),
	seats: (id) => request(`/events/${id}/seats`),
	hold: (id, seatIds) => request(`/events/${id}/hold`, { method: 'POST', body: { seatIds } }),
	release: (id) => request(`/events/${id}/hold`, { method: 'DELETE' }),
	book: (id, details, idempotencyKey = crypto.randomUUID()) =>
		request(`/events/${id}/book`, {
			method: 'POST',
			body: details,
			headers: { 'x-idempotency-key': idempotencyKey },
		}),
}

export const orders = {
	list: () => request('/orders'),
	seller: () => request('/orders/seller'),
	updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
	get: (id) => request(`/orders/${id}`),
	placeFromCart: (details, idempotencyKey = crypto.randomUUID()) =>
		request('/orders', {
			method: 'POST',
			body: details,
			headers: { 'x-idempotency-key': idempotencyKey },
		}),
}

export const flashSales = {
	listActive: () => request('/flash-sales'),
	mine: () => request('/flash-sales/mine'),
	get: (id) => request(`/flash-sales/${id}`),
	create: (payload) => request('/flash-sales', { method: 'POST', body: payload }),
	activate: (id) => request(`/flash-sales/${id}/activate`, { method: 'PATCH' }),
	end: (id) => request(`/flash-sales/${id}/end`, { method: 'PATCH' }),
	checkout: (flashSaleId, idempotencyKey = crypto.randomUUID()) =>
		request('/flash-sales/checkout/atomic', {
			method: 'POST',
			body: { flashSaleId },
			headers: { 'x-idempotency-key': idempotencyKey },
		}),
	// Kept for the load-test comparison: this route has the known race condition.
	checkoutNaive: (flashSaleId) =>
		request('/flash-sales/checkout/naive', { method: 'POST', body: { flashSaleId } }),
}

export default { auth, products, cart, orders, flashSales, events }
