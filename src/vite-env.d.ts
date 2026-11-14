/// <reference types="vite/client" />

// Tell TypeScript about the custom env var we read in src/api/client.ts.
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
