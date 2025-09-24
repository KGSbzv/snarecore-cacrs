import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';
import { cwd, env as processEnv } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Replaced process.cwd() with an explicit import from 'node:process' to resolve TypeScript type errors where 'cwd' was not found on the global 'process' object.
  const env = loadEnv(mode, cwd(), '');
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
    // The 'define' block is used to replace global constants in the code.
    // This provides a robust way to inject environment variables, working around
    // potential issues with `import.meta.env` in specific environments.
    define: {
      '__API_BASE_URL__': JSON.stringify(env.VITE_API_BASE_URL || '')
    },
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: Number(processEnv.PORT) || 5173,
    },
    preview: {
      host: '0.0.0.0', // Ensure the server is accessible within the container network.
      port: Number(processEnv.PORT) || 8080 // Respect the PORT env var from the deployment environment.
    }
  }
})