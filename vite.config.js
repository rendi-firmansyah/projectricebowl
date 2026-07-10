import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devApiTarget = env.VITE_DEV_API_BASE_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      ...(devApiTarget ? {
        proxy: {
          '/api': devApiTarget,
          '/uploads': devApiTarget,
        },
      } : {}),
    },
  }
})
