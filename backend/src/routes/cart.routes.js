import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
	addToCart,
	clearCart,
	getCart,
	removeFromCart,
	updateCartItemQuantity,
} from '../controllers/cart.controler.js'

const router = Router()

router.route('/').get(verifyJWT, getCart).post(verifyJWT, addToCart).delete(verifyJWT, clearCart)
router.route('/:itemId').patch(verifyJWT, updateCartItemQuantity).delete(verifyJWT, removeFromCart)

export default router
