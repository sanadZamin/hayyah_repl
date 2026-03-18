import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: async () => {
      const res = await apiFetch("/api/dashboard/metrics");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<Record<string, unknown>>;
    },
  });
}
