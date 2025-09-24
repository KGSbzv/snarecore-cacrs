/// <reference types="vite/client" />

// FIX: Added manual type definitions for ImportMetaEnv and ImportMeta to resolve
// the error "Cannot find type definition file for 'vite/client'". This provides
// TypeScript with the necessary type information for `import.meta.env`,
// which is used to access environment variables in Vite projects.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Add other environment variables here if they are used in the project
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
