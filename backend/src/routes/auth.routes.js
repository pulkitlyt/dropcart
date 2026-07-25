import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
	getCurrentUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
} from '../controllers/auth.controller.js'

const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(verifyJWT, refreshAccessToken)
router.route('/me').get(verifyJWT, getCurrentUser)

export default router