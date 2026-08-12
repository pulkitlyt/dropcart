import { v2 as cloudinary } from 'cloudinary'


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
				
				transformation: [
				
					{ width: 1600, height: 1600, crop: 'limit' },
					{ quality: 'auto', fetch_format: 'auto' },
				],
		
				use_filename: Boolean(filename),
			
				filename_override: filename,
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

const publicIdFromUrl = (url) => {
	if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null

	const match = url.match(/\/upload\/(?:[^/]+\/)*?v\d+\/(.+)$/)
	if (!match) return null

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

const destroyByUrls = async (urls = []) => {
	if (!configure()) return 0

	const ids = urls.map(publicIdFromUrl).filter(Boolean)
	if (ids.length === 0) return 0

	const results = await Promise.all(ids.map(destroy))
	return results.filter(Boolean).length
}

export { isConfigured, uploadBuffer, destroy, destroyByUrls, publicIdFromUrl, FOLDER }
