import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

const KEYCLOAK_TOKEN_URL = "https://hayyah.me/realms/hayyah/protocol/openid-connect/token";

router.post("/auth/token", async (req, res) => {
  try {
    const body = new URLSearchParams(req.body as Record<string, string>).toString();

    const { stdout } = await execFileAsync("curl", [
      "-s",
      "-o", "-",
      "-w", "\n__STATUS__%{http_code}",
      "-X", "POST",
      KEYCLOAK_TOKEN_URL,
      "-H", "Content-Type: application/x-www-form-urlencoded",
      "--data-raw", body,
    ]);

    const splitIdx = stdout.lastIndexOf("\n__STATUS__");
    const jsonPart = stdout.slice(0, splitIdx);
    const statusPart = stdout.slice(splitIdx + "\n__STATUS__".length);
    const status = parseInt(statusPart, 10) || 502;

    console.log(`[auth] POST token → ${status}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonPart);
    } catch {
      parsed = { error: "parse_error", error_description: jsonPart };
    }

    res.status(status).json(parsed);
  } catch (err) {
    console.error("[auth] error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach authentication server." });
  }
});

export default router;
