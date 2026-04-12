import { normalizeViteApiBaseUrl } from "@workspace/api-client-react";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** When set, browser calls that host for `/api/*` (use `https://host` or `https://host/api`). */
const apiOrigin = normalizeViteApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function apiUrl(path: string): string {
  if (apiOrigin) {
    return `${apiOrigin}/api${path}`;
  }
  return `${base}/api${path}`;
}
