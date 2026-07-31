import { useCallback, useEffect, useState } from 'react'
import { products as productsApi } from '../lib/api'
import { adaptProduct } from '../lib/adapters'

export const useProducts = ({ limit = 12, category, search } = {}) => {
	const [products, setProducts] = useState([])
	const [total, setTotal] = useState(0)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)

	const refresh = useCallback(async () => {
		setIsLoading(true)
		try {
			const data = await productsApi.list({ limit, category, search })
			setProducts((data?.products || []).map(adaptProduct))
			setTotal(data?.total || 0)
			setError(null)
		} catch (err) {
			setError(err)
			setProducts([])
		} finally {
			setIsLoading(false)
		}
	}, [limit, category, search])

	useEffect(() => {
		refresh()
	}, [refresh])

	return { products, total, isLoading, error, refresh }
}
