import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Without this, navigating between routes keeps the previous scroll offset —
// noticeable because the home page is very tall.
const ScrollToTop = () => {
	const { pathname } = useLocation()

	useEffect(() => {
		window.scrollTo(0, 0)
	}, [pathname])

	return null
}

export default ScrollToTop
