import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { deleteReview } from '../controllers/review.controller.js'

const router = Router()

router.route('/:id').delete(verifyJWT, deleteReview)

export default router
