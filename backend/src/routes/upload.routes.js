import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'
import { uploadSingle, uploadMany, handleUploadErrors } from '../middlewares/upload.middleware.js'
import { uploadImage, uploadImages, deleteImage } from '../controllers/upload.controller.js'

const router = Router()
const canUpload = [verifyJWT, verifyRole('admin', 'seller')]

router.post('/image', ...canUpload, uploadSingle, handleUploadErrors, uploadImage)
router.post('/images', ...canUpload, uploadMany, handleUploadErrors, uploadImages)
router.delete('/image', ...canUpload, deleteImage)

export default router
