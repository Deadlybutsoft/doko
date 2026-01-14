/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ALGOLIA_APP_ID: string
    readonly VITE_ALGOLIA_SEARCH_KEY: string
    readonly VITE_GOOGLE_AI_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
