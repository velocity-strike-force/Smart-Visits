/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENABLE_EMPTY_API_FALLBACK?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
