/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Laravel API base URL, e.g. https://cpc-orgs-api.onrender.com (no trailing slash, no /api) */
  readonly VITE_API_URL: string
  /** Show the demo account buttons on the login page */
  readonly VITE_SHOW_DEMO_ACCOUNTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
