/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_VISITS_DATA_SOURCE?: string;
    readonly VITE_API_BASE_URL?: string;
    /** Query param for GET /api/profile when using api mode */
    readonly VITE_PROFILE_USER_ID?: string;
    readonly VITE_ENABLE_EMPTY_API_FALLBACK?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
