import { Router } from "express";
import { request as httpsRequest } from "node:https";

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
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function hayyahPost(url: string, token: string, body: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
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
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
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
  const page = typeof req.query.page === "string" ? req.query.page : "0";
  const size = typeof req.query.size === "string" ? req.query.size : "10";
  const pageNum = Math.max(0, Number(page) || 0);
  const sizeNum = Math.max(1, Number(size) || 10);
  const paging = `page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;

  const candidates = [
    `${BASE_URL}/tasks?${paging}`,
    `${BASE_URL}/tasks?${paging}&userID=${userId}`,
    `${BASE_URL}/tasks?${paging}&userId=${userId}`,
  ];

  let lastStatus = 502;
  let lastData = "";

  for (const url of candidates) {
    const { status, data } = await hayyahGet(url, token);
    console.log(`[tasks] GET ${url} → ${status}${status !== 200 ? ` | ${data.slice(0, 150)}` : ""}`);
    if (status === 200) {
      let parsed: unknown;
      try { parsed = JSON.parse(data); } catch { parsed = []; }
      // Normalize array responses into paginated envelope so frontend can navigate pages.
      if (Array.isArray(parsed)) {
        const content = parsed;
        res.status(200).json({
          content,
          page: pageNum,
          size: sizeNum,
          totalElements: content.length,
          totalPages: content.length === sizeNum ? pageNum + 2 : pageNum + 1,
          hasNext: content.length === sizeNum,
          hasPrevious: pageNum > 0,
        });
        return;
      }
      res.status(200).json(parsed);
      return;
    }
    lastStatus = status;
    lastData = data;
  }

  let parsed: unknown;
  try { parsed = JSON.parse(lastData); } catch { parsed = { error: "fetch_failed", error_description: lastData || `Status ${lastStatus}` }; }
  res.status(lastStatus).json(parsed);
});

router.get("/tasks/unassigned", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const page = typeof req.query.page === "string" ? req.query.page : "0";
  const size = typeof req.query.size === "string" ? req.query.size : "20";
  const paging = `page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
  const url = `${BASE_URL}/tasks/unassigned?${paging}`;

  try {
    const { status, data } = await hayyahGet(url, token);
    console.log(`[tasks] GET ${url} → ${status}${status !== 200 ? ` | ${data.slice(0, 150)}` : ""}`);
    if (!data || data.trim() === "") {
      res.status(status).end();
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = [];
    }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[tasks] GET /tasks/unassigned error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach task API." });
  }
});

router.post("/tasks/:id/assign", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const { id } = req.params;
  const technicianId = String((req.body as Record<string, unknown>)?.technicianId ?? "").trim();

  if (!id || !technicianId) {
    res.status(400).json({ error: "bad_request", error_description: "task id and technicianId are required." });
    return;
  }

  const candidates: Array<{ url: string; body: string }> = [
    { url: `${BASE_URL}/tasks/${encodeURIComponent(id)}/assign/${encodeURIComponent(technicianId)}`, body: "{}" },
    { url: `${BASE_URL}/tasks/${encodeURIComponent(id)}/assign?technicianId=${encodeURIComponent(technicianId)}`, body: "{}" },
    { url: `${BASE_URL}/tasks/assign`, body: JSON.stringify({ taskId: id, technicianId }) },
  ];

  let lastStatus = 502;
  let lastData = "";
  for (const c of candidates) {
    try {
      const { status, data } = await hayyahPost(c.url, token, c.body);
      console.log(`[tasks] ASSIGN POST ${c.url} → ${status}${status >= 400 ? ` | ${data.slice(0, 150)}` : ""}`);
      if (status >= 200 && status < 300) {
        if (!data || data.trim() === "") {
          res.status(status).json({ success: true });
          return;
        }
        try {
          res.status(status).json(JSON.parse(data));
        } catch {
          res.status(status).json({ success: true, raw: data });
        }
        return;
      }
      lastStatus = status;
      lastData = data;
    } catch (err) {
      console.error(`[tasks] ASSIGN candidate failed: ${c.url}`, err);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lastData);
  } catch {
    parsed = { error: "assign_failed", error_description: lastData || `Status ${lastStatus}` };
  }
  res.status(lastStatus).json(parsed);
});

router.post("/tasks", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const payload = JSON.stringify(req.body);
    const { status, data } = await hayyahPost(`${BASE_URL}/tasks`, token, payload);
    console.log(`[tasks] POST ${BASE_URL}/tasks → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
    let parsed: unknown;
    try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
    res.status(status).json(parsed);
  } catch (err) {
    console.error("[tasks] POST error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach task API." });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const { id } = req.params;

  try {
    const { status, data } = await hayyahDelete(`${BASE_URL}/tasks/${id}`, token);
    console.log(`[tasks] DELETE ${BASE_URL}/tasks/${id} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
    if (status === 204 || status === 200) {
      res.status(status).json({ success: true });
    } else {
      let parsed: unknown;
      try { parsed = JSON.parse(data); } catch { parsed = { error: "delete_failed", error_description: data || `Status ${status}` }; }
      res.status(status).json(parsed);
    }
  } catch (err) {
    console.error("[tasks] DELETE error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach task API." });
  }
});

export default router;
