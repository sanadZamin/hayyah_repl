interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLIENT_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
