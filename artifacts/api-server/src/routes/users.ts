import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

const USERS_BASE = "https://hayyah.me/api/v1/user";

async function curlGet(url: string, token: string): Promise<{ status: number; data: string }> {
  const { stdout } = await execFileAsync("curl", [
    "-s", "-o", "-", "-w", "\n__STATUS__%{http_code}",
    "-X", "GET", url,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Accept: application/json",
    "-H", "Origin: https://hayyah.me",
    "-H", "Referer: https://hayyah.me/",
  ]);
  const splitIdx = stdout.lastIndexOf("\n__STATUS__");
  const data = stdout.slice(0, splitIdx);
  const status = parseInt(stdout.slice(splitIdx + "\n__STATUS__".length), 10) || 502;
  return { status, data };
}

router.get("/users", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  const page = req.query.page ?? "0";
  const size = req.query.size ?? "10";
  const url = `${USERS_BASE}?page=${page}&size=${size}`;

  try {
    const { status, data } = await curlGet(url, token);
    console.log(`[users] GET ${url} → ${status}${status !== 200 ? ` | ${data.slice(0, 200)}` : ""}`);

    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { error: "parse_error" }; }

    res.status(status).json(parsed);
  } catch (err) {
    console.error("[users] error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach users API." });
  }
});

export default router;
