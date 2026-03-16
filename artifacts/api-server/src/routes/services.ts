import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/services", async (_req, res) => {
  try {
    const services = await db.select().from(servicesTable);
    res.json(services.map(s => ({
      ...s,
      basePrice: parseFloat(s.basePrice as string),
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

export default router;
