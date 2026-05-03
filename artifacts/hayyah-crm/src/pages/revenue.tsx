import { useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { maxRevenueInRows, parseRevenueByMonth, type RevenueMonthRow } from "@/lib/stats-revenue";
import { Loader2, RefreshCcw, TrendingUp } from "lucide-react";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function Revenue() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardMetrics();

  const revenueByMonth = useMemo(() => parseRevenueByMonth(data), [data]);
  const maxRevenue = useMemo(() => maxRevenueInRows(revenueByMonth), [revenueByMonth]);

  const totals = useMemo(() => {
    if (!revenueByMonth?.length) return { sum: 0, avg: 0, peak: null as RevenueMonthRow | null };
    const sum = revenueByMonth.reduce((a, r) => a + r.value, 0);
    const avg = sum / revenueByMonth.length;
    const peak = revenueByMonth.reduce((best, r) => (r.value > best.value ? r : best), revenueByMonth[0]);
    return { sum, avg, peak };
  }, [revenueByMonth]);

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <AppLayout activeNav="revenue">
      <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>
              Revenue
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Monthly performance from your Hayyah stats feed.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium bg-white transition-colors hover:bg-gray-50 disabled:opacity-60"
            style={{ color: "var(--hayyah-navy)", borderColor: "#e2e8f0" }}
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white shadow-sm flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--hayyah-blue)" }} />
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-2xl bg-white shadow-sm p-8 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : "Could not load revenue data."}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} />
                  Total (period)
                </div>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--hayyah-navy)" }}>
                  {revenueByMonth?.length ? formatMoney(totals.sum) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-gray-500 text-sm font-medium">Average / month</p>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--hayyah-navy)" }}>
                  {revenueByMonth?.length ? formatMoney(totals.avg) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-gray-500 text-sm font-medium">Peak month</p>
                <p className="text-2xl font-bold mt-2" style={{ color: "var(--hayyah-navy)" }}>
                  {totals.peak ? `${totals.peak.month} · ${formatMoney(totals.peak.value)}` : "—"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <div className="w-1 h-5 rounded-full" style={{ background: "var(--hayyah-blue)" }} />
                  Monthly revenue
                </h2>
              </div>
              <div className="p-6">
                {revenueByMonth && revenueByMonth.length > 0 ? (
                  <div className="h-72 flex items-end justify-between gap-2 pb-6 relative">
                    <div className="absolute left-12 right-0 top-2 border-t border-dashed border-gray-200" />
                    <div className="absolute left-12 right-0 top-[33%] border-t border-dashed border-gray-200" />
                    <div className="absolute left-12 right-0 top-[66%] border-t border-dashed border-gray-200" />
                    <div className="absolute left-12 right-0 bottom-6 border-t border-dashed border-gray-200" />
                    <div className="w-full flex justify-between items-end pl-6 relative z-10 h-full">
                      {revenueByMonth.map((row, i) => (
                        <div key={`${row.month}-${i}`} className="flex flex-col items-center gap-2 w-full">
                          <div
                            className="w-full max-w-[32px] mx-auto rounded-t-md transition-all"
                            style={{
                              height: `${Math.max(4, (row.value / maxRevenue) * 100)}%`,
                              background:
                                i === revenueByMonth.length - 1 ? "var(--hayyah-blue)" : "var(--hayyah-blue-light)",
                            }}
                            title={`${row.month}: ${formatMoney(row.value)}`}
                          />
                          <span className="text-xs text-gray-500 font-medium">{row.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-72 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
                    Revenue analytics unavailable. Stats may not include monthly revenue yet.
                  </div>
                )}
              </div>
            </div>

            {revenueByMonth && revenueByMonth.length > 0 && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h2 className="text-base font-bold" style={{ color: "var(--hayyah-navy)" }}>
                    Breakdown
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="font-semibold text-gray-500 py-3 px-6 text-left">Month</th>
                        <th className="font-semibold text-gray-500 py-3 px-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByMonth.map((row, i) => (
                        <tr key={`${row.month}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-6 font-medium" style={{ color: "var(--hayyah-navy)" }}>
                            {row.month}
                          </td>
                          <td className="py-3 px-6 text-right text-gray-800">{formatMoney(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
