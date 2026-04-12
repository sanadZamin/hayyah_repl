import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

export interface PricingRule {
  id?: string;
  serviceType: string;
  subType?: string | null;
  basePrice: number;
  perUnitPrice?: number | null;
  unitField?: string | null;
  currency?: string;
  active?: boolean;
  is_active?: boolean;
  extras?: Record<string, number> | null;
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const o = body as Record<string, unknown>;
  return (
    (o.error_description as string) ||
    (o.message as string) ||
    (o.error as string) ||
    `Request failed (${res.status})`
  );
}

async function fetchPricingRules(): Promise<PricingRule[]> {
  const res = await apiFetch("/api/v1/pricing/rules");
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : (data.content ?? data.data ?? []);
}

export function usePricingRules(enabled: boolean) {
  return useQuery<PricingRule[], Error>({
    queryKey: ["pricing-rules"],
    queryFn: fetchPricingRules,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePricingRuleMutations() {
  const queryClient = useQueryClient();

  const createRule = useMutation({
    mutationFn: async (body: Omit<PricingRule, "id">) => {
      const res = await apiFetch("/api/v1/pricing/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.json().catch(() => ({}));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<PricingRule> }) => {
      const res = await apiFetch(`/api/v1/pricing/rules/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseError(res));
      return res.status === 204 ? null : res.json().catch(() => ({}));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });

  const deactivateRule = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/pricing/rules/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });

  return { createRule, updateRule, deactivateRule };
}
