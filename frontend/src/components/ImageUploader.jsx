import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

/**
 * Uploads files to /api/v1/uploads and reports back the resulting URLs.
 *
 * Uses XMLHttpRequest rather than fetch purely because fetch still gives no
 * upload progress events — on a slow connection a large photo otherwise looks
 * like the form has frozen.
 */
const uploadWithProgress = (file, folder, onProgress) =>
	new Promise((resolve, reject) => {
		const form = new FormData()
		form.append('image', file)
		form.append('folder', folder)

		const xhr = new XMLHttpRequest()
		xhr.open('POST', '/api/v1/uploads/image')
		xhr.withCredentials = true

		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
		})

		xhr.addEventListener('load', () => {
			let payload = null
			try {
				payload = JSON.parse(xhr.responseText)
			} catch {
				/* non-JSON error page */
			}

			if (xhr.status >= 200 && xhr.status < 300 && payload?.data?.url) {
				resolve(payload.data)
			} else {
				reject(new Error(payload?.message || `Upload failed (${xhr.status})`))
			}
		})

		xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
		xhr.send(form)
	})

const ImageUploader = ({ value = [], onChange, folder = 'products', max = 6, label = 'Images' }) => {
	const inputRef = useRef(null)
	const [pending, setPending] = useState([])
	const [error, setError] = useState(null)
	const [isDragging, setIsDragging] = useState(false)

	const remaining = max - value.length

	const handleFiles = async (fileList) => {
		setError(null)
		const files = Array.from(fileList || [])
		if (files.length === 0) return

		if (files.length > remaining) {
			setError(`You can add ${remaining} more image${remaining === 1 ? '' : 's'}.`)
			return
		}

		const tooBig = files.find((file) => file.size > MAX_BYTES)
		if (tooBig) {
			// Checked client-side too so the user isn't made to wait for an
			// upload the server is going to reject anyway.
			setError(`${tooBig.name} is ${(tooBig.size / 1024 / 1024).toFixed(1)}MB. Maximum is 5MB.`)
			return
		}

		const tickets = files.map((file) => ({ id: crypto.randomUUID(), name: file.name, progress: 0 }))
		setPending(tickets)

		try {
			const uploaded = []
			for (const [index, file] of files.entries()) {
				const asset = await uploadWithProgress(file, folder, (progress) =>
					setPending((current) =>
						current.map((t) => (t.id === tickets[index].id ? { ...t, progress } : t)),
					),
				)
				uploaded.push(asset.url)
			}
			onChange([...value, ...uploaded])
		} catch (err) {
			setError(err.message)
		} finally {
			setPending([])
			if (inputRef.current) inputRef.current.value = ''
		}
	}

	return (
		<div>
			<p className="mb-2 text-xs text-white/40">
				{label} <span className="text-white/25">· up to {max}, 5MB each</span>
			</p>

			{/* Existing images */}
			{value.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-2">
					{value.map((url, index) => (
						<motion.div
							key={url}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-zinc-800"
						>
							<img src={url} alt="" className="h-full w-full object-cover" />
							{index === 0 && (
								<span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] font-bold text-emerald-300">
									COVER
								</span>
							)}
							<button
								type="button"
								onClick={() => onChange(value.filter((item) => item !== url))}
								className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white/70 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
							>
								<X className="h-3 w-3" />
							</button>
						</motion.div>
					))}
				</div>
			)}

			{/* In-flight uploads */}
			{pending.map((ticket) => (
				<div key={ticket.id} className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
					<div className="flex items-center gap-2 text-xs text-white/60">
						<Loader2 className="h-3 w-3 animate-spin" />
						<span className="min-w-0 flex-1 truncate">{ticket.name}</span>
						<span className="font-mono">{ticket.progress}%</span>
					</div>
					<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
						<div
							className="h-full rounded-full bg-emerald-500 transition-all"
							style={{ width: `${ticket.progress}%` }}
						/>
					</div>
				</div>
			))}

			{/* Drop zone */}
			{remaining > 0 && pending.length === 0 && (
				<div
					onDragOver={(e) => {
						e.preventDefault()
						setIsDragging(true)
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={(e) => {
						e.preventDefault()
						setIsDragging(false)
						handleFiles(e.dataTransfer.files)
					}}
					onClick={() => inputRef.current?.click()}
					className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center transition-colors ${
						isDragging
							? 'border-emerald-500/60 bg-emerald-500/10'
							: 'border-white/15 bg-white/5 hover:border-white/30'
					}`}
				>
					<UploadCloud className={`h-6 w-6 ${isDragging ? 'text-emerald-400' : 'text-white/35'}`} />
					<span className="text-sm text-white/55">
						<span className="font-semibold text-emerald-400">Choose files</span> or drag them here
					</span>
					<span className="text-xs text-white/25">JPEG, PNG, WebP, GIF or AVIF</span>
				</div>
			)}

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT}
				multiple={max > 1}
				onChange={(e) => handleFiles(e.target.files)}
				className="hidden"
			/>

			{error && (
				<p className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
					<AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
					{error}
				</p>
			)}

			{value.length === 0 && pending.length === 0 && !error && (
				<p className="mt-2 flex items-center gap-1.5 text-xs text-white/25">
					<ImageIcon className="h-3 w-3" />
					The first image becomes the cover.
				</p>
			)}
		</div>
	)
}

export default ImageUploader
