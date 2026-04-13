/** Best-effort parse after `POST /api/v1/user/create` or `createExternal` (AppUserDto, Keycloak, etc.). */
export function extractNewUserId(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  for (const key of ["id", "userId", "user_id", "sub"]) {
    const v = o[key];
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
  }
  return null;
}
