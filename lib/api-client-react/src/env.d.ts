interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLIENT_SECRET?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_AUTH_TOKEN_URL?: string;
  readonly VITE_AUTH_REFRESH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
