import { apiUrl } from "./api-url";

const TOKEN_KEY = "hayyah_token";
const AUTH_KEY = "hayyah_auth";
const CLIENT_ID = "web_client";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET ?? "";

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

function getTokenData(): TokenData | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveTokenData(data: TokenData) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  // Dispatch event so the app can react (redirect to login)
  window.dispatchEvent(new CustomEvent("hayyah:logout"));
}

// In-flight refresh promise to avoid multiple simultaneous refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokenData = getTokenData();
  if (!tokenData?.refresh_token) {
    clearSession();
    return null;
  }

  try {
    const res = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: tokenData.refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!res.ok) {
      console.warn("[api-fetch] Refresh failed with status", res.status);
      clearSession();
      return null;
    }

    const data: TokenData = await res.json();
    if (!data.access_token) {
      clearSession();
      return null;
    }

    saveTokenData(data);
    console.log("[api-fetch] Token refreshed successfully");
    return data.access_token;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Authenticated fetch that automatically refreshes the token on 401
 * and clears the session if refresh also fails.
 */
export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const tokenData = getTokenData();
  const token = tokenData?.access_token ?? "";

  // Root-relative /api/* → same-origin /api/… (Vite proxies /api in dev; prod nginx routes /api)
  const url: RequestInfo =
    typeof input === "string" && input.startsWith("/api/")
      ? apiUrl(input.slice(4))
      : input;

  const method = String(init.method ?? "GET").toUpperCase();
  const isCacheableMethod = method === "GET" || method === "HEAD";

  const makeRequest = (t: string) =>
    fetch(url, {
      ...init,
      // Avoid stale API responses when the user hits Refresh or remounts quickly
      cache: isCacheableMethod && init.cache === undefined ? "no-store" : init.cache,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
        Authorization: t ? `Bearer ${t}` : "",
      },
    });

  const res = await makeRequest(token);

  if (res.status !== 401) return res;

  // 401 — try to refresh once
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
  }
  const newToken = await refreshPromise;

  if (!newToken) {
    // Refresh failed; return the original 401 so callers can handle it
    return res;
  }

  // Retry with new token
  return makeRequest(newToken);
}
