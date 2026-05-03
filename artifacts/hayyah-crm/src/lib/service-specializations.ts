import type { TechnicianSpecialization } from "@workspace/api-client-react";

/** Register-technician / hayyah v1 `TechnicianSpecialization` enum (uppercase). */
export const SERVICE_SPECIALIZATION_OPTIONS = [
  { value: "CLEANER", label: "Cleaning" },
  { value: "LAUNDRY", label: "Laundry" },
  { value: "ELECTRICIAN", label: "Electrician" },
  { value: "PAINTER", label: "Painting" },
  { value: "PLUMBER", label: "Plumbing" },
  { value: "CARPENTER", label: "Carpentry" },
  { value: "HANDYMAN", label: "Handyman" },
  { value: "MOVER", label: "Moving" },
  { value: "CHEF", label: "Chef" },
  { value: "HVAC", label: "HVAC" },
  { value: "LOCKSMITH", label: "Locksmith" },
  { value: "PEST_CONTROL", label: "Pest control" },
] as const satisfies readonly { value: TechnicianSpecialization; label: string }[];

export type ServiceSpecializationValue = (typeof SERVICE_SPECIALIZATION_OPTIONS)[number]["value"];
