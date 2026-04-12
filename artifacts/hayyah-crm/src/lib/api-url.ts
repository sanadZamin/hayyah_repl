import { normalizeViteApiBaseUrl } from "@workspace/api-client-react";

/**
 * When set, browser calls that host for `/api/*` (use `https://host` or `https://host/api`).
 * When unset, use root-relative `/api/*` (not `/frontend/api/*`) so production at
 * https://host/frontend/ still hits https://host/api/… — same as Vite’s `/api` proxy in dev.
 */
const apiOrigin = normalizeViteApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function apiUrl(path: string): string {
  if (apiOrigin) {
    return `${apiOrigin}/api${path}`;
  }
  return `/api${path}`;
}
