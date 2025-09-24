/// <reference types="vite/client" />

// FIX: Manually define the `ImportMeta` interface as a workaround for environments
// where `vite/client` types might not be loaded correctly. This resolves errors
// related to `import.meta.env` being undefined.
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // Add other environment variables here if needed.
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
