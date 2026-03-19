import { Router } from "express";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

const router = Router();

const KEYCLOAK_TOKEN_URL =
  process.env.KEYCLOAK_TOKEN_URL ??
  "https://hayyah.me/realms/hayyah/protocol/openid-connect/token";
const CLIENT_ID = "web_client";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET ?? "";

async function keycloakPost(body: string): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(KEYCLOAK_TOKEN_URL);
    const requestFn = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = requestFn(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          let json: unknown;
          try { json = JSON.parse(raw); } catch { json = { error: "parse_error", error_description: raw }; }
          resolve({ status: res.statusCode ?? 502, json });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Login
router.post("/auth/token", async (req, res) => {
  try {
    const params = req.body as Record<string, string>;
    // Always use server-side secret — never trust an empty secret from the client
    if (!params.client_secret && CLIENT_SECRET) {
      params.client_secret = CLIENT_SECRET;
    }
    if (!params.client_id) {
      params.client_id = CLIENT_ID;
    }
    const body = new URLSearchParams(params).toString();
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
