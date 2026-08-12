import * as cloudinary from '../lib/cloudinary.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const FOLDERS = ['products', 'events', 'avatars', 'misc']

const resolveFolder = (value) => (FOLDERS.includes(value) ? value : 'misc')

const assertConfigured = () => {
	if (!cloudinary.isConfigured()) {
		throw new ApiError(
			503,
			'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
		)
	}
}

const uploadImage = asyncHandler(async (req, res) => {
	assertConfigured()

	if (!req.file) {
		throw new ApiError(400, 'No file received. Send one file under the field name "image".')
	}

	const result = await cloudinary.uploadBuffer(req.file.buffer, {
		folder: resolveFolder(req.body?.folder),
		filename: req.file.originalname,
	})

	return res.status(201).json(new ApiResponse(201, result, 'Image uploaded successfully'))
})

const uploadImages = asyncHandler(async (req, res) => {
	assertConfigured()

	if (!req.files?.length) {
		throw new ApiError(400, 'No files received. Send files under the field name "images".')
	}

	const folder = resolveFolder(req.body?.folder)

	// Upload in parallel, but roll back anything that succeeded if one fails —
	// a half-uploaded set would leave orphaned assets burning storage quota
	// that nothing in the database references.
	const settled = await Promise.allSettled(
		req.files.map((file) =>
			cloudinary.uploadBuffer(file.buffer, { folder, filename: file.originalname }),
		),
	)

	const uploaded = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value)
	const failed = settled.filter((r) => r.status === 'rejected')

	if (failed.length) {
		await Promise.all(uploaded.map((asset) => cloudinary.destroy(asset.publicId)))
		throw new ApiError(502, `Upload failed for ${failed.length} of ${req.files.length} files. None were kept.`)
	}

	return res.status(201).json(new ApiResponse(201, { images: uploaded }, 'Images uploaded successfully'))
})

const deleteImage = asyncHandler(async (req, res) => {
    assertConfigured()

	const publicId = req.body?.publicId || cloudinary.publicIdFromUrl(req.body?.url)

	if (!publicId) {
		throw new ApiError(400, 'Provide a publicId, or a cloudinary url to derive it from')
	}

	const ok = await cloudinary.destroy(publicId)
	if (!ok) throw new ApiError(502, 'Could not delete that asset')

	return res.status(200).json(new ApiResponse(200, { publicId }, 'Image deleted successfully'))
})

export { uploadImage, uploadImages, deleteImage }
