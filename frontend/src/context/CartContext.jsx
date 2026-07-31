import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { cart as cartApi } from '../lib/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
	const { isAuthenticated } = useAuth()
	const [cart, setCart] = useState(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState(null)

	const refresh = useCallback(async () => {
		if (!isAuthenticated) {
			setCart(null)
			return
		}

		setIsLoading(true)
		try {
			setCart(await cartApi.get())
			setError(null)
		} catch (err) {
			setError(err)
		} finally {
			setIsLoading(false)
		}
	}, [isAuthenticated])

	useEffect(() => {
		refresh()
	}, [refresh])

	const runCartAction = useCallback(async (action) => {
		setError(null)
		try {
			const updated = await action()
			setCart(updated)
			return updated
		} catch (err) {
			setError(err)
			throw err
		}
	}, [])

	const addItem = useCallback(
		(productId, quantity = 1) => runCartAction(() => cartApi.add(productId, quantity)),
		[runCartAction],
	)

	const updateQuantity = useCallback(
		(productId, quantity) => runCartAction(() => cartApi.updateQuantity(productId, quantity)),
		[runCartAction],
	)

	const removeItem = useCallback(
		(productId) => runCartAction(() => cartApi.remove(productId)),
		[runCartAction],
	)

	const clear = useCallback(() => runCartAction(() => cartApi.clear()), [runCartAction])

	const items = cart?.items || []
	const totalItems = items.reduce((total, item) => total + item.quantity, 0)
	const subtotal = items.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0)

	const value = useMemo(
		() => ({
			cart,
			items,
			totalItems,
			subtotal,
			isLoading,
			error,
			refresh,
			addItem,
			updateQuantity,
			removeItem,
			clear,
		}),
		[cart, items, totalItems, subtotal, isLoading, error, refresh, addItem, updateQuantity, removeItem, clear],
	)

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
	const context = useContext(CartContext)
	if (!context) {
		throw new Error('useCart must be used within a CartProvider')
	}
	return context
}
