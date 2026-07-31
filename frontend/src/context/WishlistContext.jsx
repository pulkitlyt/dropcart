import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'dropcart.wishlist'
const WishlistContext = createContext(null)

// There's no wishlist collection on the backend, so this persists locally.
export const WishlistProvider = ({ children }) => {
	const [ids, setIds] = useState(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
			return Array.isArray(stored) ? stored : []
		} catch {
			return []
		}
	})

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
	}, [ids])

	const toggle = useCallback((productId) => {
		setIds((current) =>
			current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
		)
	}, [])

	const has = useCallback((productId) => ids.includes(productId), [ids])

	const value = useMemo(() => ({ ids, count: ids.length, toggle, has }), [ids, toggle, has])

	return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
	const context = useContext(WishlistContext)
	if (!context) {
		throw new Error('useWishlist must be used within a WishlistProvider')
	}
	return context
}
