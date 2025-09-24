import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';
import { env as processEnv } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
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
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: Number(processEnv.PORT) || 5173,
    },
    preview: {
      host: '0.0.0.0', // Ensure the server is accessible within the container network.
      port: Number(processEnv.PORT) || 8080 // Respect the PORT env var from the deployment environment.
    }
  }
});