import { Router } from "express";
import { request as httpsRequest } from "node:https";

const router = Router();
const BASE = "https://hayyah.me/api/v1/pricing/rules";

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
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function hayyahWrite(method: "POST" | "PUT", url: string, token: string, body: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://hayyah.me",
          Referer: "https://hayyah.me/",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => resolve({ status: res.statusCode ?? 502, data }));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function hayyahDelete(url: string, token: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "DELETE",
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
      },
    );
    req.on("error", reject);
    req.end();
  });
}

router.get("/v1/pricing/rules", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const q = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = q ? `${BASE}?${q}` : BASE;
  try {
    const { status, data } = await hayyahGet(url, token);
    if (status === 204) {
      res.status(204).end();
      return;
    }
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[pricing] GET rules error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach pricing API." });
  }
});

router.post("/v1/pricing/rules", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const body = JSON.stringify(req.body ?? {});
    const { status, data } = await hayyahWrite("POST", BASE, token, body);
    if (status === 204) {
      res.status(204).end();
      return;
    }
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[pricing] POST rule error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach pricing API." });
  }
});

router.put("/v1/pricing/rules/:id", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const { id } = req.params;
  try {
    const body = JSON.stringify(req.body ?? {});
    const { status, data } = await hayyahWrite("PUT", `${BASE}/${encodeURIComponent(id)}`, token, body);
    if (status === 204) {
      res.status(204).end();
      return;
    }
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[pricing] PUT rule error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach pricing API." });
  }
});

router.delete("/v1/pricing/rules/:id", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const { id } = req.params;
  try {
    const { status, data } = await hayyahDelete(`${BASE}/${encodeURIComponent(id)}`, token);
    if (status === 204) {
      res.status(204).end();
      return;
    }
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[pricing] DELETE rule error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach pricing API." });
  }
});

export default router;
