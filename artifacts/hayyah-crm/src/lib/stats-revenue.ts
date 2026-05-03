/**
 * Normalize monthly revenue from Hayyah `GET /api/v1/stats` (shape varies by deployment).
 */
export type RevenueMonthRow = { month: string; value: number };

export function parseRevenueByMonth(
  data: Record<string, unknown> | undefined,
): RevenueMonthRow[] | null {
  if (!data) return null;
  const monthlyRaw = data.monthlyRevenue ?? data.revenueByMonth;
  if (!monthlyRaw) return null;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (Array.isArray(monthlyRaw)) {
    const arr = monthlyRaw
      .map((v, i) => {
        const n = typeof v === "number" ? v : Number(v);
        return { month: monthNames[i] ?? `M${i + 1}`, value: Number.isFinite(n) ? n : 0 };
      })
      .slice(0, 12);
    return arr.length > 0 ? arr : null;
  }

  if (typeof monthlyRaw === "object") {
    const rec = monthlyRaw as Record<string, unknown>;
    const rows = Object.entries(rec).map(([k, v]) => {
      const n = typeof v === "number" ? v : Number(v);
      return { month: k.slice(0, 3), value: Number.isFinite(n) ? n : 0 };
    });
    return rows.length > 0 ? rows.slice(0, 12) : null;
  }
  return null;
}

export function maxRevenueInRows(rows: RevenueMonthRow[] | null): number {
  if (!rows || rows.length === 0) return 1;
  return Math.max(...rows.map((r) => r.value), 1);
}
