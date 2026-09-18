import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Portul din src/PsihoAdinaGghita.Api/Properties/launchSettings.json (profilul "http").
// Un singur loc care definește adresa API-ului în dev; restul aplicației folosește
// exclusiv instanța axios din src/api/client.ts (vezi plan §9.3).
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:5180'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true, secure: false },
      '/uploads': { target: API_TARGET, changeOrigin: true, secure: false },
      '/sitemap.xml': { target: API_TARGET, changeOrigin: true, secure: false },
      '/robots.txt': { target: API_TARGET, changeOrigin: true, secure: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
