import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 6
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

/**
 * Files are held in memory as Buffers and streamed to Cloudinary, so nothing is
 * ever written to disk. That avoids temp-file cleanup entirely and works on
 * read-only serverless filesystems. The size cap is what makes memory storage
 * safe — without it a large upload would sit in RAM.
 */
const storage = multer.memoryStorage()

const upload = multer({
	storage,
	limits: {
		fileSize: MAX_FILE_BYTES,
		files: MAX_FILES,
	},
	fileFilter(req, file, callback) {
		if (!ALLOWED.includes(file.mimetype)) {
			// Rejecting here means the request body is abandoned early rather
			// than buffering a file we were never going to accept.
			callback(new ApiError(400, `Unsupported file type: ${file.mimetype}. Use JPEG, PNG, WebP, GIF or AVIF.`))
			return
		}
		callback(null, true)
	},
})

/**
 * Translates multer's own errors into the app's ApiError envelope. Without this
 * a file that is too large surfaces as a raw MulterError and gets reported as a
 * generic 500 instead of a useful 400.
 */
const handleUploadErrors = (error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		const messages = {
			LIMIT_FILE_SIZE: `File too large. Maximum size is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
			LIMIT_FILE_COUNT: `Too many files. Maximum is ${MAX_FILES}.`,
			LIMIT_UNEXPECTED_FILE: 'Unexpected field name for the uploaded file.',
		}
		return next(new ApiError(400, messages[error.code] || `Upload failed: ${error.message}`))
	}
	return next(error)
}

const uploadSingle = upload.single('image')
const uploadMany = upload.array('images', MAX_FILES)

export { upload, uploadSingle, uploadMany, handleUploadErrors, MAX_FILE_BYTES, MAX_FILES, ALLOWED }
