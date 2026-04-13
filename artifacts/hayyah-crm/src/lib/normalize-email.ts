/** Trim and lowercase for consistent API submission (server still validates format). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
