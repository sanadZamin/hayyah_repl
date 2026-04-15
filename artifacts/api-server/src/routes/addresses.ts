import { Router, type Request, type Response } from "express";
import { request as httpsRequest } from "node:https";

const router = Router();
const ADDRESS_BASE = "https://hayyah.me/api/v1/address";

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
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 502, data }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function proxyGetAddress(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const rawId = req.params.addressId;
  const addressId = (Array.isArray(rawId) ? rawId[0] : rawId) ?? "";
  if (!addressId) {
    res.status(400).json({ error: "bad_request", error_description: "Missing address id." });
    return;
  }
  const url = `${ADDRESS_BASE}/${encodeURIComponent(addressId)}`;

  try {
    const { status, data } = await hayyahGet(url, token);
    console.log(`[address] GET ${url} -> ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
    if (!data || data.trim() === "") {
      res.status(status).end();
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { raw: data };
    }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[address] GET error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach address API." });
  }
}

router.get("/v1/address/:addressId", proxyGetAddress);
router.get("/address/:addressId", proxyGetAddress);

export default router;
