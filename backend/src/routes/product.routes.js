import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'
import { getProductReviews, upsertReview } from '../controllers/review.controller.js'
import { attachUser } from '../middlewares/auth.middleware.js'
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getCategories,
	getMyProducts,
	getProductById,
	updateProduct,
} from '../controllers/product.controller.js'

const router = Router()

router.route('/').get(getAllProducts).post(verifyJWT, verifyRole('admin', 'seller'), createProduct)

// Must be declared before '/:id', otherwise these are parsed as product ids.
router.route('/categories').get(getCategories)
router.route('/mine').get(verifyJWT, verifyRole('admin', 'seller'), getMyProducts)

// attachUser so a signed-in visitor gets their own review flagged, without
// making the listing itself require auth.
router.route('/:id/reviews').get(attachUser, getProductReviews).post(verifyJWT, upsertReview)

router.route('/:id').get(getProductById).patch(verifyJWT, updateProduct).delete(verifyJWT, deleteProduct)

export default router
