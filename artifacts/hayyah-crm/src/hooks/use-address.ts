import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { apiPath } from "@/lib/api-path";

export function useAddressById(addressId: string | null) {
  return useQuery({
    queryKey: ["address", addressId],
    queryFn: async () => {
      const res = await apiFetch(apiPath(`/address/${encodeURIComponent(addressId as string)}`));
      if (!res.ok) {
        throw new Error(`Failed to fetch address (${res.status})`);
      }
      return res.json() as Promise<unknown>;
    },
    enabled: !!addressId,
    staleTime: 60_000,
    retry: 1,
  });
}
