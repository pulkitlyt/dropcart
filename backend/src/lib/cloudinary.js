import { v2 as cloudinary } from 'cloudinary'

/**
 * Cloudinary wrapper.
 *
 * Uploads stream straight from memory — multer holds the file as a Buffer and
 * it goes to Cloudinary without ever touching disk. The common tutorial pattern
 * (write to a temp file, upload the path, unlink) leaves orphaned files behind
 * whenever the upload throws, and doesn't work on read-only serverless
 * filesystems.
 */
const FOLDER = process.env.CLOUDINARY_FOLDER || 'dropcart'

let configured = false

const configure = () => {
	if (configured) return true

	const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
	if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false

	cloudinary.config({
		cloud_name: CLOUDINARY_CLOUD_NAME,
		api_key: CLOUDINARY_API_KEY,
		api_secret: CLOUDINARY_API_SECRET,
		secure: true,
	})
	configured = true
	return true
}

const isConfigured = () => configure()

/**
 * Uploads a Buffer and resolves to { url, publicId, width, height, bytes, format }.
 * `folder` keeps products, events and avatars separate in the media library.
 */
const uploadBuffer = (buffer, { folder = 'misc', filename } = {}) =>
	new Promise((resolve, reject) => {
		if (!configure()) {
			reject(new Error('Cloudinary is not configured'))
			return
		}

		const stream = cloudinary.uploader.upload_stream(
			{
				folder: `${FOLDER}/${folder}`,
				resource_type: 'image',
				// Let Cloudinary pick the best format and compression for each
				// viewer instead of serving whatever the seller happened to upload.
				transformation: [{ quality: 'auto', fetch_format: 'auto' }],
				// Cap absurd dimensions; a 6000px phone photo helps nobody.
				eager: [{ width: 1200, height: 1200, crop: 'limit' }],
				public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined,
				unique_filename: true,
				overwrite: false,
			},
			(error, result) => {
				if (error) return reject(error)
				resolve({
					url: result.secure_url,
					publicId: result.public_id,
					width: result.width,
					height: result.height,
					bytes: result.bytes,
					format: result.format,
				})
			},
		)

		stream.end(buffer)
	})

/**
 * Recovers the public_id from a Cloudinary URL.
 *
 * Products store plain URL strings (`images: [String]`), which the whole UI
 * reads as `images[0]`. Rather than migrate that to objects, the id is derived
 * back out of the URL when an asset needs deleting. Format:
 *   https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
 * Anything that isn't a Cloudinary URL (e.g. the seeded Unsplash links) returns
 * null and is simply skipped.
 */
const publicIdFromUrl = (url) => {
	if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null

	const match = url.match(/\/upload\/(?:[^/]+\/)*?v\d+\/(.+)$/)
	if (!match) return null

	// Strip the extension, keeping any folder path.
	return match[1].replace(/\.[^./]+$/, '')
}

const destroy = async (publicId) => {
	if (!configure() || !publicId) return false
	try {
		const result = await cloudinary.uploader.destroy(publicId)
		return result.result === 'ok' || result.result === 'not found'
	} catch {
		return false
	}
}

/** Best-effort cleanup for a list of stored URLs. Never throws. */
const destroyByUrls = async (urls = []) => {
	if (!configure()) return 0

	const ids = urls.map(publicIdFromUrl).filter(Boolean)
	if (ids.length === 0) return 0

	const results = await Promise.all(ids.map(destroy))
	return results.filter(Boolean).length
}

export { isConfigured, uploadBuffer, destroy, destroyByUrls, publicIdFromUrl, FOLDER }
