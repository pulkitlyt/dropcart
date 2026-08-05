import { Router } from 'express'
import {
	activateFlashSale,
	createFlashSale,
	endFlashSale,
	getActiveFlashSales,
	getMyFlashSales,
	getFlashSaleById,
	naiveCheckout,
	atomicCheckout,
	redisCheckout,
} from '../controllers/flashsale.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'
import { idempotencyCheck } from '../middlewares/idempotency.middleware.js'

const router = Router()

router.get('/', getActiveFlashSales)
// Declared before '/:id' so 'mine' isn't parsed as an ObjectId.
router.get('/mine', verifyJWT, verifyRole('admin', 'seller'), getMyFlashSales)
router.get('/:id', getFlashSaleById)
router.post('/', verifyJWT, verifyRole('admin', 'seller'), createFlashSale)
// Ownership is enforced inside the controller, so sellers can manage their own.
router.patch('/:id/activate', verifyJWT, verifyRole('admin', 'seller'), activateFlashSale)
router.patch('/:id/end', verifyJWT, verifyRole('admin', 'seller'), endFlashSale)
router.post('/checkout/naive', verifyJWT, naiveCheckout)
router.post('/checkout/atomic', verifyJWT, idempotencyCheck, atomicCheckout)
router.post('/checkout/redis', verifyJWT, idempotencyCheck, redisCheckout)

export default router
