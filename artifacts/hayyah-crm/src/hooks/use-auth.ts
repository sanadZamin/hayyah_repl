import { useState, useEffect, useMemo } from "react";
import { apiUrl } from "@/lib/api-url";
import { normalizeViteApiBaseUrl } from "@workspace/api-client-react";

const AUTH_KEY = "hayyah_auth";
const TOKEN_KEY = "hayyah_token";

const KEYCLOAK_TOKEN_PATH = "/auth/realms/hayyah/protocol/openid-connect/token";
const TOKEN_URL = resolveTokenUrl();
const CLIENT_ID = "web_client";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET ?? "";

function resolveTokenUrl(): string {
  const explicitUrl = import.meta.env.VITE_AUTH_TOKEN_URL?.trim();
  if (explicitUrl) return explicitUrl;

  const authOrigin = normalizeViteApiBaseUrl(import.meta.env.VITE_AUTH_BASE_URL);
  if (authOrigin) return `${authOrigin}${KEYCLOAK_TOKEN_PATH}`;

  return apiUrl("/auth/token");
}

export interface AuthUser {
  email: string;
  name: string;
  username: string;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

/** Keycloak-style JWT: realm_access.roles + resource_access.*.roles */
export function isAdminFromToken(token: string | null): boolean {
  if (!token) return false;
  const claims = parseJwt(token);
  const realm = (claims.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const rc = claims.resource_access as Record<string, { roles?: string[] }> | undefined;
  const clientRoles = rc
    ? Object.values(rc).flatMap((v) => v?.roles ?? [])
    : [];
  const all = [...realm, ...clientRoles].map((r) => String(r).toUpperCase());
  return all.some(
    (r) =>
      r === "ADMIN" ||
      r === "APP_ADMIN" ||
      r === "ROLE_ADMIN" ||
      r === "REALM-ADMIN",
  );
}

function readStoredUserIfAdmin(): AuthUser | null {
  try {
    const tokenStored = localStorage.getItem(TOKEN_KEY);
    const authStored = localStorage.getItem(AUTH_KEY);
    if (!tokenStored || !authStored) return null;
    const data: TokenData = JSON.parse(tokenStored);
    if (!data.access_token || !isAdminFromToken(data.access_token)) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return JSON.parse(authStored) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUserIfAdmin());

  // Listen for forced logout from token refresh failures
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener("hayyah:logout", handleLogout);
    return () => window.removeEventListener("hayyah:logout", handleLogout);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "password",
      username,
      password,
      client_secret: CLIENT_SECRET,
    });

    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as Record<string, string>).error_description || "Invalid username or password.";
        return { success: false, error: msg };
      }

      const data: TokenData = await res.json();
      if (!data.access_token) {
        return { success: false, error: "Invalid response from authentication server." };
      }

      if (!isAdminFromToken(data.access_token)) {
        return {
          success: false,
          error: "This account is not authorized. Admin access is required to use Hayyah CRM.",
        };
      }

      const claims = parseJwt(data.access_token);

      const authUser: AuthUser = {
        email: (claims.email as string) || username,
        name: (claims.name as string) || (claims.preferred_username as string) || username,
        username: (claims.preferred_username as string) || username,
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
      setUser(authUser);

      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.dispatchEvent(new CustomEvent("hayyah:logout"));
  };

  const getToken = (): string | null => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) return null;
      const data: TokenData = JSON.parse(stored);
      return data.access_token || null;
    } catch {
      return null;
    }
  };

  const isAdmin = useMemo(() => isAdminFromToken(getToken()), [user]);

  return { user, login, logout, getToken, isAuthenticated: !!user, isAdmin };
}
