/**
 * Version segment after `/api`. Default `/v1` matches Spring-only routes (tasks, technicians, etc.).
 * Do **not** use this for OpenAPI paths that are already `/api/dashboard/metrics`, `/api/healthz`, etc.
 * — use generated `get*Url()` from `@workspace/api-client-react` or `/api/...` directly.
 * For local `artifacts/api-server` with no `/v1`, set `VITE_API_PATH_PREFIX=` in `.env.development`.
 */
export function apiVersionSegment(): string {
  const raw = import.meta.env.VITE_API_PATH_PREFIX;
  if (raw === "") return "";
  if (typeof raw === "string" && raw.trim() !== "") {
    const s = raw.trim().replace(/^\/+|\/+$/g, "");
    return s ? `/${s}` : "";
  }
  return "/v1";
}

export function apiPath(pathWithQuery: string): string {
  const p = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `/api${apiVersionSegment()}${p}`;
}
