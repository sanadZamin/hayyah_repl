/**
 * Accepts either `https://host` or `https://host/api`; callers append `/api/...` paths.
 * Also strips a trailing `/frontend` segment — that base is for the SPA URL, not API calls
 * (otherwise requests become `https://host/frontend/api/...` and often 404 on the API host).
 */
export function normalizeViteApiBaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let s = raw.trim().replace(/\/+$/, "");
  if (s.endsWith("/api")) {
    s = s.slice(0, -4).replace(/\/+$/, "");
  }
  if (s.endsWith("/frontend")) {
    s = s.slice(0, -"/frontend".length).replace(/\/+$/, "");
  }
  return s;
}
