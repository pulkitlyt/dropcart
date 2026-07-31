import { Router } from 'express'
import { attachUser, verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'
import {
	bookSeats,
	createEvent,
	getEventById,
	getEvents,
	getMyEvents,
	getSeats,
	holdSeats,
	releaseSeats,
} from '../controllers/event.controller.js'

const router = Router()

router.route('/').get(getEvents).post(verifyJWT, verifyRole('admin', 'seller'), createEvent)

// Before '/:id' so 'mine' isn't parsed as an ObjectId.
router.route('/mine').get(verifyJWT, verifyRole('admin', 'seller'), getMyEvents)

router.route('/:id').get(getEventById)
router.route('/:id/seats').get(attachUser, getSeats)
router.route('/:id/hold').post(verifyJWT, holdSeats).delete(verifyJWT, releaseSeats)
router.route('/:id/book').post(verifyJWT, bookSeats)

export default router
