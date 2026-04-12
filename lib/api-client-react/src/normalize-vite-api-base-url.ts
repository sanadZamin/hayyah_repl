/**
 * Accepts either `https://host` or `https://host/api`; callers append `/api/...` paths.
 */
export function normalizeViteApiBaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  let s = raw.trim().replace(/\/+$/, "");
  if (s.endsWith("/api")) {
    s = s.slice(0, -4).replace(/\/+$/, "");
  }
  return s;
}
