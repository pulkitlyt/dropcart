import { ApiError } from '../utils/ApiError.js'

const verifyRole = (...allowedRoles) => {
	return (req, _, next) => {
		if (!req.user) {
			return next(new ApiError(401, 'Unauthorized request'))
		}

		if (!allowedRoles.includes(req.user.role)) {
			return next(new ApiError(403, 'Forbidden: insufficient permissions'))
		}

		next()
	}
}

export { verifyRole }
