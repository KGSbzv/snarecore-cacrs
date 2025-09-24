// FIX: Removed the triple-slash directive for "node" types.
// The explicit `import process from 'process'` is sufficient and this directive
// was causing an error because @types/node might not be available in the environment.

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';
// FIX: Explicitly import process to make Node.js types available for `process.cwd()`.
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files and merge with process.env.
  // process.env will overwrite values from .env files, which is the desired behavior for production environments.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  
  // Explicitly read the PORT from the merged environment for server configuration.
  const port = Number(env.PORT) || 8080;

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
    // Make process.env variables available in client-side code.
    // This is crucial for fixing crashes caused by accessing environment variables.
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: port,
    },
    preview: {
      host: '0.0.0.0', // Ensure the server is accessible within the container network.
      port: port // Respect the PORT env var from the deployment environment.
    }
  }
})
