import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// The backend runs on PORT=8000 and allows CORS_ORIGIN=http://localhost:5173,
// so direct calls work too. The proxy keeps dev same-origin, which means
// httpOnly auth cookies (sameSite: 'strict') are sent without any extra config.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
			},
		},
	},
})
