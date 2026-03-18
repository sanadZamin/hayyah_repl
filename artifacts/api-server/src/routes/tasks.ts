import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

const BASE_URL = "https://hayyah.me/api/v1";

function parseJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"));
  } catch {
    return {};
  }
}

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

async function curlPost(url: string, token: string, body: string): Promise<{ status: number; data: string }> {
  const { stdout } = await execFileAsync("curl", [
    "-s", "-o", "-", "-w", "\n__STATUS__%{http_code}",
    "-X", "POST", url,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Content-Type: application/json",
    "-H", "Accept: application/json",
    "-H", "Origin: https://hayyah.me",
    "-H", "Referer: https://hayyah.me/",
    "--data-raw", body,
  ]);
  const splitIdx = stdout.lastIndexOf("\n__STATUS__");
  const data = stdout.slice(0, splitIdx);
  const status = parseInt(stdout.slice(splitIdx + "\n__STATUS__".length), 10) || 502;
  return { status, data };
}

router.get("/tasks", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const claims = parseJwt(token);
  const userId = (claims.sub as string) || "";

  // Try these URL patterns in order until one succeeds
  const candidates = [
    `${BASE_URL}/tasks`,
    `${BASE_URL}/tasks?userID=${userId}`,
    `${BASE_URL}/tasks?userId=${userId}`,
    `${BASE_URL}/tasks/user/${userId}`,
  ];

  let lastStatus = 502;
  let lastData = "";

  for (const url of candidates) {
    const { status, data } = await curlGet(url, token);
    console.log(`[tasks] GET ${url} → ${status}${status !== 200 ? ` | ${data.slice(0, 150)}` : ""}`);
    if (status === 200) {
      let parsed: unknown;
      try { parsed = JSON.parse(data); } catch { parsed = []; }
      res.status(200).json(parsed);
      return;
    }
    lastStatus = status;
    lastData = data;
  }

  // All candidates failed
  let parsed: unknown;
  try { parsed = JSON.parse(lastData); } catch { parsed = { error: "fetch_failed", error_description: lastData || `Status ${lastStatus}` }; }
  res.status(lastStatus).json(parsed);
});

// Create task
router.post("/tasks", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const payload = JSON.stringify(req.body);
    const { status, data } = await curlPost(`${BASE_URL}/tasks`, token, payload);
    console.log(`[tasks] POST ${BASE_URL}/tasks → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[tasks] POST error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach task API." });
  }
});

export default router;
