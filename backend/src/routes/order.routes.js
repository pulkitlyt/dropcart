import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'
import { idempotencyCheck } from '../middlewares/idempotency.middleware.js'
import {
	getMyOrders,
	getOrderById,
	getSellerOrders,
	placeOrderFromCart,
	updateOrderStatus,
} from '../controllers/order.controller.js'

const router = Router()

router.route('/').get(verifyJWT, getMyOrders).post(verifyJWT, idempotencyCheck, placeOrderFromCart)

// Before '/:id' so 'seller' isn't parsed as an ObjectId.
router.route('/seller').get(verifyJWT, verifyRole('admin', 'seller'), getSellerOrders)

router.route('/:id').get(verifyJWT, getOrderById)
router.route('/:id/status').patch(verifyJWT, verifyRole('admin', 'seller'), updateOrderStatus)

export default router
