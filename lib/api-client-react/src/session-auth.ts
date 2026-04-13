import { normalizeViteApiBaseUrl } from "./normalize-vite-api-base-url";

export const TOKEN_KEY = "hayyah_token";
export const AUTH_KEY = "hayyah_auth";

const CLIENT_ID = "web_client";

export interface StoredTokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

function apiPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const origin = normalizeViteApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (origin) return `${origin}/api${p}`;
  return `/api${p}`;
}

export function getTokenData(): StoredTokenData | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? (JSON.parse(stored) as StoredTokenData) : null;
  } catch {
    return null;
  }
}

export function saveTokenData(data: StoredTokenData): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
}

export function getAccessToken(): string | null {
  return getTokenData()?.access_token ?? null;
}

/** Clears CRM session and notifies the app (redirect to login via useAuth). */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent("hayyah:logout"));
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const tokenData = getTokenData();
  if (!tokenData?.refresh_token) {
    clearSession();
    return null;
  }

  const clientSecret = import.meta.env.VITE_CLIENT_SECRET ?? "";

  try {
    const res = await fetch(apiPath("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: tokenData.refresh_token,
        client_id: CLIENT_ID,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      console.warn("[session-auth] Refresh failed:", res.status);
      clearSession();
      return null;
    }

    const data = (await res.json()) as StoredTokenData;
    if (!data.access_token) {
      clearSession();
      return null;
    }

    saveTokenData(data);
    return data.access_token;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Refreshes the access token using the stored refresh_token.
 * Concurrent callers share one in-flight refresh.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function isAuthEndpointUrl(url: string): boolean {
  try {
    const path = url.includes("://") ? new URL(url).pathname : url.split("?")[0] ?? url;
    return (
      path.includes("/api/auth/token") ||
      path.includes("/api/auth/refresh")
    );
  } catch {
    return false;
  }
}
