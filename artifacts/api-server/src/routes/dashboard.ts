import { Router, type IRouter } from "express";
import { request as httpsRequest } from "node:https";

const router: IRouter = Router();

const STATS_URL = "https://hayyah.me/api/v1/stats";

function hayyahGet(url: string, token: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          Origin: "https://hayyah.me",
          Referer: "https://hayyah.me/",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => resolve({ status: res.statusCode ?? 502, data }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

router.get("/dashboard/metrics", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const { status, data } = await hayyahGet(STATS_URL, token);
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
