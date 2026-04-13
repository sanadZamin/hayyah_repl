/**
 * Client-side normalization aligned with typical server rules: trim, strip inner spaces,
 * leading `00` → `+`. Does not validate country codes; backend remains authoritative.
 */
export function normalizeMobileNumber(raw: string): string {
  let s = raw.trim().replace(/\s+/g, "");
  if (s.startsWith("00")) {
    s = `+${s.slice(2)}`;
  }
  return s;
}
