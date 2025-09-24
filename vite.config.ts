import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    })
  ],
  // The 'define' block has been removed. Vite automatically handles env vars prefixed with VITE_
  // and exposes them on `import.meta.env`.
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    host: '0.0.0.0', // Ensure the server is accessible within the container network.
    port: Number(process.env.PORT) || 8080 // Respect the PORT env var from the deployment environment.
  }
})