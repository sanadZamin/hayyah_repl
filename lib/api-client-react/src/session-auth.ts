import { normalizeViteApiBaseUrl } from "./normalize-vite-api-base-url";

export const TOKEN_KEY = "hayyah_token";
export const AUTH_KEY = "hayyah_auth";

const CLIENT_ID = "web_client";
const KEYCLOAK_TOKEN_PATH = "/auth/realms/hayyah/protocol/openid-connect/token";

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

function resolveKeycloakTokenUrl(): string {
  const explicitUrl = import.meta.env.VITE_AUTH_TOKEN_URL?.trim();
  if (explicitUrl) return explicitUrl;

  const authOrigin = normalizeViteApiBaseUrl(import.meta.env.VITE_AUTH_BASE_URL);
  if (authOrigin) return `${authOrigin}${KEYCLOAK_TOKEN_PATH}`;

  return apiPath("/auth/token");
}

function resolveRefreshUrl(): string {
  const explicitRefreshUrl = import.meta.env.VITE_AUTH_REFRESH_URL?.trim();
  if (explicitRefreshUrl) return explicitRefreshUrl;
  return resolveKeycloakTokenUrl();
}

function usesOidcTokenEndpoint(url: string): boolean {
  return url.includes("/protocol/openid-connect/token");
}

function appendClientSecretIfPresent(params: URLSearchParams, clientSecret: string): void {
  if (clientSecret.trim()) {
    params.set("client_secret", clientSecret);
  }
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
  const refreshUrl = resolveRefreshUrl();

  try {
    const res = await fetch(
      refreshUrl,
      usesOidcTokenEndpoint(refreshUrl)
        ? {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: (() => {
              const params = new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: "refresh_token",
                refresh_token: tokenData.refresh_token,
              });
              appendClientSecretIfPresent(params, clientSecret);
              return params.toString();
            })(),
          }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refresh_token: tokenData.refresh_token,
              client_id: CLIENT_ID,
              ...(clientSecret.trim() ? { client_secret: clientSecret } : {}),
            }),
          },
    );

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
      path.includes("/api/auth/refresh") ||
      path.includes("/protocol/openid-connect/token")
    );
  } catch {
    return false;
  }
}
