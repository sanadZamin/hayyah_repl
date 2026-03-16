import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, customersTable, techniciansTable, servicesTable } from "@workspace/db/schema";
import { eq, count, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/metrics", async (_req, res) => {
  try {
    const [{ total: totalCustomers }] = await db.select({ total: count() }).from(customersTable);
    
    const [{ total: newLeads }] = await db.select({ total: count() }).from(customersTable)
      .where(eq(customersTable.status, "lead"));
    
    const [{ total: activeBookings }] = await db.select({ total: count() }).from(bookingsTable)
      .where(sql`${bookingsTable.status} IN ('pending', 'confirmed', 'in_progress')`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [{ total: completedToday }] = await db.select({ total: count() }).from(bookingsTable)
      .where(sql`${bookingsTable.status} = 'completed' AND ${bookingsTable.scheduledAt} >= ${today} AND ${bookingsTable.scheduledAt} < ${tomorrow}`);
    
    const [{ rev }] = await db.select({ rev: sql<string>`COALESCE(SUM(CAST(${bookingsTable.price} AS NUMERIC)), 0)` })
      .from(bookingsTable).where(eq(bookingsTable.status, "completed"));
    
    const [{ total: availableTechnicians }] = await db.select({ total: count() }).from(techniciansTable)
      .where(eq(techniciansTable.status, "available"));
    
    const upcomingRows = await db.select().from(bookingsTable)
      .where(sql`${bookingsTable.status} IN ('pending', 'confirmed') AND ${bookingsTable.scheduledAt} >= NOW()`)
      .orderBy(bookingsTable.scheduledAt)
      .limit(5);
    
    const recentCustomerRows = await db.select().from(customersTable)
      .orderBy(desc(customersTable.createdAt))
      .limit(5);
    
    const statusCounts = await db.select({ status: bookingsTable.status, count: count() })
      .from(bookingsTable).groupBy(bookingsTable.status);
    
    const enrichBooking = async (b: typeof bookingsTable.$inferSelect) => {
      const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, b.customerId));
      const [service] = await db.select({ name: servicesTable.name }).from(servicesTable).where(eq(servicesTable.id, b.serviceId));
      let technicianName = undefined;
      if (b.technicianId) {
        const [tech] = await db.select({ name: techniciansTable.name }).from(techniciansTable).where(eq(techniciansTable.id, b.technicianId));
        technicianName = tech?.name;
      }
      return {
        ...b,
        price: parseFloat(b.price as string),
        scheduledAt: b.scheduledAt.toISOString(),
        createdAt: b.createdAt.toISOString(),
        customerName: customer?.name ?? "Unknown",
        serviceName: service?.name ?? "Unknown",
        technicianName,
        technicianId: b.technicianId ?? undefined,
        notes: b.notes ?? undefined,
      };
    };
    
    const upcomingBookings = await Promise.all(upcomingRows.map(enrichBooking));
    
    res.json({
      totalCustomers: Number(totalCustomers),
      activeBookings: Number(activeBookings),
      completedToday: Number(completedToday),
      revenue: parseFloat(rev ?? "0"),
      revenueGrowth: 12.5,
      newLeads: Number(newLeads),
      availableTechnicians: Number(availableTechnicians),
      upcomingBookings,
      recentCustomers: recentCustomerRows.map(c => ({
        ...c,
        totalSpent: parseFloat(c.totalSpent as string),
        createdAt: c.createdAt.toISOString(),
      })),
      bookingsByStatus: statusCounts.map(s => ({
        status: s.status,
        count: Number(s.count),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;
