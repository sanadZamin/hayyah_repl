import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { techniciansTable, type Technician as TechnicianRow } from "@workspace/db/schema";
import { CreateTechnicianBody } from "@workspace/api-zod";

const router: IRouter = Router();

/** Local DB has no user row per technician; v1 API expects a userId UUID. */
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000001";

function toV1Technician(t: TechnicianRow) {
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
    bio: "",
    createdAt: Number.isFinite(created) ? created : 0,
  };
}

router.get("/v1/technicians", async (_req, res) => {
  try {
    const technicians = await db.select().from(techniciansTable);
    res.json(technicians.map(toV1Technician));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch technicians" });
  }
});

router.post("/v1/technicians", async (req, res) => {
  try {
    const body = CreateTechnicianBody.parse(req.body);
    const name = `${body.firstName} ${body.lastName}`.trim();
    const [technician] = await db.insert(techniciansTable).values({
      name: name || body.email,
      email: body.email,
      phone: body.phone ?? "—",
      specialty: body.specialization,
    }).returning();
    res.status(201).json(toV1Technician(technician));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create technician" });
  }
});

export default router;
