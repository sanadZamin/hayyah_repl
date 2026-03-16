import { pgTable, text, serial, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const technicianStatusEnum = pgEnum("technician_status", ["available", "busy", "off"]);

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  specialty: text("specialty").notNull(),
  status: technicianStatusEnum("status").notNull().default("available"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  completedJobs: integer("completed_jobs").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true, completedJobs: true, rating: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;
