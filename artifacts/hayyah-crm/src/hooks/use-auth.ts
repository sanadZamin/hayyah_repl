import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api-url";

const AUTH_KEY = "hayyah_auth";
const TOKEN_KEY = "hayyah_token";

const TOKEN_URL = apiUrl("/auth/token");
const CLIENT_ID = "web_client";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET ?? "";

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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

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

  return { user, login, logout, getToken, isAuthenticated: !!user };
}
