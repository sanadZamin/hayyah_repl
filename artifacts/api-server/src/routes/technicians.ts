import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { techniciansTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateTechnicianBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/technicians", async (_req, res) => {
  try {
    const technicians = await db.select().from(techniciansTable);
    res.json(technicians.map(t => ({
      ...t,
      rating: parseFloat(t.rating as string),
      createdAt: t.createdAt.toISOString(),
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch technicians" });
  }
});

router.post("/technicians", async (req, res) => {
  try {
    const body = CreateTechnicianBody.parse(req.body);
    const [technician] = await db.insert(techniciansTable).values({
      name: body.name,
      email: body.email,
      phone: body.phone,
      specialty: body.specialty,
    }).returning();
    res.status(201).json({
      ...technician,
      rating: parseFloat(technician.rating as string),
      createdAt: technician.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create technician" });
  }
});

export default router;
