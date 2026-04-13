import { Router } from "express";
import { request as httpsRequest } from "node:https";

const router = Router();

const USERS_BASE = "https://hayyah.me/api/v1/user";
const USER_CREATE_URL = `${USERS_BASE}/create`;
const USER_CREATE_EXTERNAL_URL = `${USERS_BASE}/createExternal`;

function hayyahRequest(
  method: string,
  url: string,
  body: unknown | undefined,
  token?: string,
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: "https://hayyah.me",
      Referer: "https://hayyah.me/",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method,
        headers,
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
    if (body !== undefined && method !== "GET" && method !== "HEAD") {
      req.write(JSON.stringify(body));
    }
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
    const { status, data } = await hayyahRequest("GET", url, undefined, token);
    console.log(`[users] GET ${url} → ${status}${status !== 200 ? ` | ${data.slice(0, 200)}` : ""}`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { error: "parse_error" };
    }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[users] error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach users API." });
  }
});

router.post("/v1/user/create", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const { status, data } = await hayyahRequest("POST", USER_CREATE_URL, req.body, token);
    console.log(
      `[users] POST ${USER_CREATE_URL} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`,
    );
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
    console.error("[users] POST /v1/user/create error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach users API." });
  }
});

/** Spring `permitAll()` — Bearer optional; forward body as-is. */
router.post("/v1/user/createExternal", async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  try {
    const { status, data } = await hayyahRequest("POST", USER_CREATE_EXTERNAL_URL, req.body, token);
    console.log(
      `[users] POST ${USER_CREATE_EXTERNAL_URL} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`,
    );
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
    console.error("[users] POST /v1/user/createExternal error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach users API." });
  }
});

router.post("/v1/technicians/admin/:userId", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const userId = encodeURIComponent(req.params.userId);
  const url = `https://hayyah.me/api/v1/technicians/admin/${userId}`;

  try {
    const { status, data } = await hayyahRequest("POST", url, req.body, token);
    console.log(`[users] POST ${url} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
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
    console.error("[users] POST admin technician error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach users API." });
  }
});

export default router;
