import { Router } from "express";

const router = Router();

const KEYCLOAK_TOKEN_URL = "https://hayyah.me/realms/hayyah/protocol/openid-connect/token";
const CLIENT_ID = "web_client";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

async function keycloakPost(body: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  let json: unknown;
  try { json = await res.json(); } catch { json = { error: "parse_error" }; }
  return { status: res.status, json };
}

// Login
router.post("/auth/token", async (req, res) => {
  try {
    const body = new URLSearchParams(req.body as Record<string, string>).toString();
    const { status, json } = await keycloakPost(body);
    console.log(`[auth] POST token → ${status}`);
    res.status(status).json(json);
  } catch (err) {
    console.error("[auth] token error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach authentication server." });
  }
});

// Refresh
router.post("/auth/refresh", async (req, res) => {
  const { refresh_token, client_id, client_secret } = req.body as {
    refresh_token?: string;
    client_id?: string;
    client_secret?: string;
  };
  if (!refresh_token) {
    res.status(400).json({ error: "missing_token", error_description: "refresh_token is required." });
    return;
  }
  const effectiveClientId = client_id || CLIENT_ID;
  const effectiveClientSecret = client_secret || CLIENT_SECRET;
  if (!effectiveClientSecret) {
    console.error("[auth] No client_secret available for refresh — set KEYCLOAK_CLIENT_SECRET env var");
  }
  try {
    const body = new URLSearchParams({
      client_id: effectiveClientId,
      client_secret: effectiveClientSecret,
      grant_type: "refresh_token",
      refresh_token,
    }).toString();
    const { status, json } = await keycloakPost(body);
    console.log(`[auth] POST refresh → ${status}`);
    res.status(status).json(json);
  } catch (err) {
    console.error("[auth] refresh error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach authentication server." });
  }
});

export default router;
