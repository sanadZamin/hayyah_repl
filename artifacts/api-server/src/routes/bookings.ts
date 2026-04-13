import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, customersTable, techniciansTable, servicesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateBookingBody, UpdateBookingBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, booking.customerId));
  const [service] = await db.select({ name: servicesTable.name }).from(servicesTable).where(eq(servicesTable.id, booking.serviceId));
  let technicianName = undefined;
  if (booking.technicianId) {
    const [tech] = await db.select({ name: techniciansTable.name }).from(techniciansTable).where(eq(techniciansTable.id, booking.technicianId));
    technicianName = tech?.name;
  }
  return {
    ...booking,
    price: parseFloat(booking.price as string),
    scheduledAt: booking.scheduledAt.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    customerName: customer?.name ?? "Unknown",
    serviceName: service?.name ?? "Unknown",
    technicianName,
    technicianId: booking.technicianId ?? undefined,
    notes: booking.notes ?? undefined,
  };
}

router.get("/bookings", async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    const rows = status
      ? await db.select().from(bookingsTable).where(eq(bookingsTable.status, status as any))
      : await db.select().from(bookingsTable);
    const enriched = await Promise.all(rows.map(enrichBooking));
    res.json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const body = CreateBookingBody.parse(req.body);
    const [booking] = await db.insert(bookingsTable).values({
      customerId: body.customerId,
      technicianId: body.technicianId ?? null,
      serviceId: body.serviceId,
      scheduledAt: new Date(body.scheduledAt),
      address: body.address,
      notes: body.notes ?? null,
      price: String(body.price),
    }).returning();
    
    await db.update(customersTable)
      .set({ totalBookings: customersTable.totalBookings })
      .where(eq(customersTable.id, body.customerId));
    
    res.status(201).json(await enrichBooking(booking));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.get("/bookings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    return res.json(await enrichBooking(booking));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch booking" });
  }
});

router.put("/bookings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateBookingBody.parse(req.body);
    const updateData: Record<string, any> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.technicianId !== undefined) updateData.technicianId = body.technicianId;
    if (body.scheduledAt !== undefined) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.price !== undefined) updateData.price = String(body.price);
    
    const [booking] = await db.update(bookingsTable).set(updateData).where(eq(bookingsTable.id, id)).returning();
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    return res.json(await enrichBooking(booking));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update booking" });
  }
});

export default router;
