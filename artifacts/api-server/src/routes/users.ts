import { Router } from "express";
import { request as httpsRequest } from "node:https";

const router = Router();

const USERS_BASE = "https://hayyah.me/api/v1/user";

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
    const { status, data } = await hayyahGet(url, token);
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
