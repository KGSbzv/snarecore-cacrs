import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr';
// FIX: Import `process` from `node:process` to provide correct typings for `process.cwd()`
// and resolve the "Property 'cwd' does not exist on type 'Process'" error.
import { process } from 'node:process';

// https://vitejs/dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables from .env files for the current mode
  const env = loadEnv(mode, process.cwd(), '');

  // Create a define object to manually replace `import.meta.env` variables.
  // This is a robust workaround for environments where Vite's automatic
  // replacement fails, causing the "import.meta.env is undefined" error.
  const envDefine = Object.keys(env).reduce((acc, key) => {
      // Only expose variables prefixed with VITE_ to the client for security.
      if (key.startsWith('VITE_')) {
          // The key in the define object is the full expression to be replaced.
          // The value must be JSON.stringified to be inserted as a string literal in the code.
          acc[`import.meta.env.${key}`] = JSON.stringify(env[key]);
      }
      return acc;
  }, {} as Record<string, any>);
  
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
    define: envDefine, // Statically replace environment variables
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      // process.env will use the global Node.js process object
      port: Number(process.env.PORT) || 5173,
    },
    preview: {
      host: '0.0.0.0', // Ensure the server is accessible within the container network.
      // process.env will use the global Node.js process object
      port: Number(process.env.PORT) || 8080 // Respect the PORT env var from the deployment environment.
    }
  }
});