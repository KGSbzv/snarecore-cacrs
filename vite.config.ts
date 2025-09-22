import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// FIX: Explicitly import 'process' to provide correct types for `process.cwd()`
// and resolve "Property 'cwd' does not exist on type 'Process'" error.
import process from 'process';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' makes it load all env vars, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Explicitly read the PORT from the environment for server configuration.
  const port = Number(process.env.PORT) || 8080;

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
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
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