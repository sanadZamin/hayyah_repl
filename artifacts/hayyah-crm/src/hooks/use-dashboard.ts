import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { apiPath } from "@/lib/api-path";

/**
 * Production Hayyah stats: `GET /api/v1/stats` (Bearer). Same URL as `artifacts/api-server` dashboard proxy.
 * With `VITE_API_PATH_PREFIX=` (local Express), becomes `/api/stats` unless you proxy `/api/dashboard/metrics` instead.
 */
export const dashboardStatsApiPath = apiPath("/stats");

export function useDashboardMetrics() {
  return useQuery({
    queryKey: [dashboardStatsApiPath],
    queryFn: async () => {
      const res = await apiFetch(dashboardStatsApiPath);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<Record<string, unknown>>;
    },
  });
}
