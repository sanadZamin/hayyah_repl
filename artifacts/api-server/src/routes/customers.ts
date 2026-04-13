import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { CreateCustomerBody, UpdateCustomerBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res) => {
  try {
    const { search, status } = req.query as { search?: string; status?: string };
    let query = db.select().from(customersTable);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(customersTable.status, status as any));
    }
    if (search) {
      conditions.push(
        or(
          ilike(customersTable.name, `%${search}%`),
          ilike(customersTable.email, `%${search}%`),
          ilike(customersTable.phone, `%${search}%`)
        )!
      );
    }
    
    const customers = await (conditions.length > 0
      ? db.select().from(customersTable).where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => or(a!, b!)!))
      : db.select().from(customersTable));
    
    res.json(customers.map(c => ({
      ...c,
      totalSpent: parseFloat(c.totalSpent as string),
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const body = CreateCustomerBody.parse(req.body);
    const [customer] = await db.insert(customersTable).values({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      status: (body.status as any) ?? "lead",
    }).returning();
    res.status(201).json({
      ...customer,
      totalSpent: parseFloat(customer.totalSpent as string),
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    return res.json({
      ...customer,
      totalSpent: parseFloat(customer.totalSpent as string),
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.put("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateCustomerBody.parse(req.body);
    const [customer] = await db.update(customersTable)
      .set({ name: body.name, email: body.email, phone: body.phone, address: body.address, status: body.status as any })
      .where(eq(customersTable.id, id))
      .returning();
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    return res.json({
      ...customer,
      totalSpent: parseFloat(customer.totalSpent as string),
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update customer" });
  }
});

router.delete("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
