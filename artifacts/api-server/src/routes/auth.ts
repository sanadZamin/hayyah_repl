import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

const KEYCLOAK_TOKEN_URL = "https://hayyah.me/realms/hayyah/protocol/openid-connect/token";
const CLIENT_ID = "web_client";
const CLIENT_SECRET = "Vd8dMXpixGDMxFi0JJDoB0l3Pb7ThnLN";

async function curlPost(body: string): Promise<{ status: number; json: unknown }> {
  const { stdout } = await execFileAsync("curl", [
    "-s", "-o", "-", "-w", "\n__STATUS__%{http_code}",
    "-X", "POST", KEYCLOAK_TOKEN_URL,
    "-H", "Content-Type: application/x-www-form-urlencoded",
    "--data-raw", body,
  ]);
  const splitIdx = stdout.lastIndexOf("\n__STATUS__");
  const jsonPart = stdout.slice(0, splitIdx);
  const status = parseInt(stdout.slice(splitIdx + "\n__STATUS__".length), 10) || 502;
  let json: unknown;
  try { json = JSON.parse(jsonPart); } catch { json = { error: "parse_error", error_description: jsonPart }; }
  return { status, json };
}

// Login
router.post("/auth/token", async (req, res) => {
  try {
    const body = new URLSearchParams(req.body as Record<string, string>).toString();
    const { status, json } = await curlPost(body);
    console.log(`[auth] POST token → ${status}`);
    res.status(status).json(json);
  } catch (err) {
    console.error("[auth] token error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach authentication server." });
  }
});

// Refresh
router.post("/auth/refresh", async (req, res) => {
  const { refresh_token } = req.body as { refresh_token?: string };
  if (!refresh_token) {
    res.status(400).json({ error: "missing_token", error_description: "refresh_token is required." });
    return;
  }
  try {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token,
    }).toString();
    const { status, json } = await curlPost(body);
    console.log(`[auth] POST refresh → ${status}`);
    res.status(status).json(json);
  } catch (err) {
    console.error("[auth] refresh error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach authentication server." });
  }
});

export default router;
