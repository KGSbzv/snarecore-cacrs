import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';
// FIX: Changed import to get the full `process` object from node.
// This ensures that both `process.cwd()` and `process.env` are available and correctly typed.
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'import.meta.env': JSON.stringify(env)
    },
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
      // FIX: Use `process.env` from the imported `process` object.
      port: Number(process.env.PORT) || 5173,
    },
    preview: {
      host: '0.0.0.0', // Ensure the server is accessible within the container network.
      // FIX: Use `process.env` from the imported `process` object.
      port: Number(process.env.PORT) || 8080 // Respect the PORT env var from the deployment environment.
    }
  }
});
