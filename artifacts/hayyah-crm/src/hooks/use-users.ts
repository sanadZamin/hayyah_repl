import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { apiPath } from "@/lib/api-path";

export interface HayyahUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  mobileNumber?: string;
  tel?: string;
  contactNumber?: string;
  /** Keycloak stores custom fields as { fieldName: string[] } */
  attributes?: Record<string, string | string[] | undefined>;
  address?: string;
  enabled?: boolean;
  createdTimestamp?: number;
  [key: string]: unknown;
}

/** Resolve a username from any field variant the API might use. */
export function getUsername(u: HayyahUser): string {
  const raw = u as Record<string, unknown>;
  for (const key of ["username","userName","login","loginName","userLogin","handle","slug"]) {
    const val = raw[key];
    if (val && typeof val === "string") return val;
  }
  const attrs = raw.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const attrMap = attrs as Record<string, unknown>;
    for (const key of ["username","userName","login","loginName"]) {
      const val = attrMap[key];
      if (!val) continue;
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
      if (typeof val === "string") return val;
    }
  }
  return "";
}

/** Resolve a phone number from any field variant the API might use (top-level or Keycloak attributes). */
export function getPhone(u: HayyahUser): string {
  const raw = u as Record<string, unknown>;
  for (const key of ["phone","phoneNumber","mobile","mobileNumber","tel","contactNumber","cellPhone","mobilePhone"]) {
    const val = raw[key];
    if (val && typeof val === "string") return val;
  }
  const attrs = raw.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const attrMap = attrs as Record<string, unknown>;
    for (const key of ["phoneNumber","phone","mobile","mobileNumber","tel","contactNumber","cellPhone","mobilePhone"]) {
      const val = attrMap[key];
      if (!val) continue;
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
      if (typeof val === "string") return val;
    }
  }
  return "";
}

async function fetchUsers(page = 0, size = 50): Promise<HayyahUser[]> {
  const res = await apiFetch(apiPath(`/user?page=${page}&size=${size}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch users (${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.users)) return data.users;
  return [];
}

export function useUsers(page = 0, size = 50) {
  return useQuery<HayyahUser[], Error>({
    queryKey: ["users", page, size],
    queryFn: () => fetchUsers(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}
