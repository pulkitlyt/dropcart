import { useCallback, useEffect, useState } from 'react'
import { flashSales as flashSalesApi } from '../lib/api'
import { adaptFlashSale } from '../lib/adapters'

export const useFlashSales = () => {
	const [sales, setSales] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)

	const refresh = useCallback(async () => {
		try {
			const data = await flashSalesApi.listActive()
			setSales((data || []).map(adaptFlashSale))
			setError(null)
		} catch (err) {
			setError(err)
			setSales([])
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	return { sales, isLoading, error, refresh }
}
