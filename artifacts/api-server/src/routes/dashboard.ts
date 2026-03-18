import { Router, type IRouter } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router: IRouter = Router();

const STATS_URL = "https://hayyah.me/api/v1/stats";

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

router.get("/dashboard/metrics", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const { status, data } = await curlGet(STATS_URL, token);
    console.log(`[dashboard] GET ${STATS_URL} → ${status}`);

    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { error: "parse_error" }; }

    res.status(status).json(parsed);
  } catch (err) {
    console.error("[dashboard] error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach stats API." });
  }
});

export default router;
