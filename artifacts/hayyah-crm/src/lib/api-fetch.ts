import {
  clearSession,
  getAccessToken,
  refreshAccessToken,
} from "@workspace/api-client-react";
import { apiUrl } from "./api-url";

/**
 * Authenticated fetch: Bearer from session, on 401 refresh once and retry.
 * If the retry is still 401, session is cleared and `hayyah:logout` fires (re-login).
 */
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const url: RequestInfo =
    typeof input === "string" && input.startsWith("/api/")
      ? apiUrl(input.slice(4))
      : input;

  const method = String(init.method ?? "GET").toUpperCase();
  const isCacheableMethod = method === "GET" || method === "HEAD";

  const makeRequest = (token: string) =>
    fetch(url, {
      ...init,
      cache: isCacheableMethod && init.cache === undefined ? "no-store" : init.cache,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

  let res = await makeRequest(getAccessToken() ?? "");

  if (res.status !== 401) return res;

  const newToken = await refreshAccessToken();
  if (!newToken) {
    return res;
  }

  res = await makeRequest(newToken);
  if (res.status === 401) {
    clearSession();
  }

  return res;
}
