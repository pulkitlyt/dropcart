import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getProductById,
	updateProduct,
} from '../controllers/product.controller.js'

const router = Router()

router.route('/').get(getAllProducts).post(verifyJWT, createProduct)
router.route('/:id').get(getProductById).patch(verifyJWT, updateProduct).delete(verifyJWT, deleteProduct)

export default router
