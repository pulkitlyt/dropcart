import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		let cancelled = false

		// A 401 here just means nobody is signed in yet — not an error worth surfacing.
		auth
			.me()
			.then((currentUser) => {
				if (!cancelled) setUser(currentUser)
			})
			.catch(() => {
				if (!cancelled) setUser(null)
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [])

	const login = useCallback(async (credentials) => {
		const loggedInUser = await auth.login(credentials)
		setUser(loggedInUser)
		return loggedInUser
	}, [])

	const register = useCallback(
		async (payload) => {
			await auth.register(payload)
			return login({ email: payload.email, password: payload.password })
		},
		[login],
	)

	const logout = useCallback(async () => {
		try {
			await auth.logout()
		} finally {
			setUser(null)
		}
	}, [])

	const value = useMemo(
		() => ({ user, isLoading, isAuthenticated: Boolean(user), login, register, logout }),
		[user, isLoading, login, register, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
