import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { techniciansTable, type Technician as TechnicianRow } from "@workspace/db/schema";
import { CreateTechnicianBody } from "@workspace/api-zod";
import { request as httpsRequest } from "node:https";

const router: IRouter = Router();
const REMOTE_TECHNICIANS_URL = "https://hayyah.me/api/v1/technicians";

/** Local DB has no user row per technician; v1 API expects a userId UUID. */
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000001";

function parseBearerClaims(
  authorization: string | undefined,
): Record<string, unknown> {
  if (!authorization?.startsWith("Bearer ")) return {};
  try {
    const token = authorization.slice(7);
    const payload = token.split(".")[1];
    if (!payload) return {};
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toV1Technician(t: TechnicianRow, bioOverride?: string | null) {
  const name = (t.name ?? "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "—";
  const lastName = parts.slice(1).join(" ") || "—";
  const ratingRaw = t.rating as string | number | null | undefined;
  const r = typeof ratingRaw === "number" ? ratingRaw : parseFloat(String(ratingRaw ?? ""));
  const created =
    t.createdAt instanceof Date
      ? t.createdAt.getTime()
      : new Date(t.createdAt as string).getTime();
  return {
    id: String(t.id),
    userId: PLACEHOLDER_USER_ID,
    firstName,
    lastName,
    email: t.email,
    specialization: t.specialty,
    verified: t.status === "available",
    rating: Number.isFinite(r) ? r : null,
    bio: bioOverride ?? "",
    createdAt: Number.isFinite(created) ? created : 0,
  };
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
      (remoteRes) => {
        let data = "";
        remoteRes.on("data", (chunk) => {
          data += chunk;
        });
        remoteRes.on("end", () =>
          resolve({ status: remoteRes.statusCode ?? 502, data }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function hayyahRequest(
  method: "PUT" | "DELETE",
  url: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          Origin: "https://hayyah.me",
          Referer: "https://hayyah.me/",
        },
      },
      (remoteRes) => {
        let data = "";
        remoteRes.on("data", (chunk) => {
          data += chunk;
        });
        remoteRes.on("end", () =>
          resolve({ status: remoteRes.statusCode ?? 502, data }),
        );
      },
    );
    req.on("error", reject);
    if (body !== undefined && method !== "DELETE") {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

router.get("/v1/technicians", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);

  try {
    const { status, data } = await hayyahGet(REMOTE_TECHNICIANS_URL, token);
    console.log(
      `[technicians] GET ${REMOTE_TECHNICIANS_URL} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`,
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
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach technicians API." });
  }
});

router.post("/v1/technicians", async (req, res) => {
  try {
    const parsed = CreateTechnicianBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        message: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }
    const body = parsed.data;
    const claims = parseBearerClaims(req.headers.authorization);

    const emailRaw = claims.email;
    const email =
      typeof emailRaw === "string" && emailRaw.trim()
        ? emailRaw.trim()
        : `${String(claims.sub ?? "dev-user")}@jwt.local`;

    const given = typeof claims.given_name === "string" ? claims.given_name : "";
    const family = typeof claims.family_name === "string" ? claims.family_name : "";
    const fromNames = `${given} ${family}`.trim();
    const preferred =
      typeof claims.preferred_username === "string" ? claims.preferred_username : "";
    const name = fromNames || preferred || "Technician";

    const [technician] = await db.insert(techniciansTable).values({
      name,
      email,
      phone: "—",
      specialty: body.specialization,
    }).returning();

    res.status(201).json(toV1Technician(technician, body.bio ?? null));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create technician" });
  }
});

router.put("/v1/technicians/:id", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const id = encodeURIComponent(req.params.id);
  const url = `${REMOTE_TECHNICIANS_URL}/${id}`;
  try {
    const { status, data } = await hayyahRequest("PUT", url, token, req.body);
    console.log(`[technicians] PUT ${url} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
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
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "proxy_error", error_description: "Could not update technician." });
  }
});

router.delete("/v1/technicians/:id", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const id = encodeURIComponent(req.params.id);
  const url = `${REMOTE_TECHNICIANS_URL}/${id}`;
  try {
    const { status, data } = await hayyahRequest("DELETE", url, token);
    console.log(`[technicians] DELETE ${url} → ${status}${status >= 400 ? ` | ${data.slice(0, 200)}` : ""}`);
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
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "proxy_error", error_description: "Could not delete technician." });
  }
});

export default router;
