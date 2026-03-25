import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";

export interface Task {
  id: string;
  title: string;
  description: string;
  orderStatus: string;
  created_at: number;
  userID: string;
  serviceID: string;
  taskDateTime: number;
  customerName?: string;
  taskType?: string;
  technicianName?: string;
}

async function fetchTasks(): Promise<Task[]> {
  const res = await apiFetch("/api/tasks");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch tasks (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.content ?? data.data ?? []);
}

export function useTasks() {
  return useQuery<Task[], Error>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useDeleteTasks() {
  const queryClient = useQueryClient();

  const deleteTasks = async (ids: string[]): Promise<{ deleted: string[]; failed: string[] }> => {
    const results = await Promise.allSettled(
      ids.map(id => apiFetch(`/api/tasks/${id}`, { method: "DELETE" }))
    );

    const deleted: string[] = [];
    const failed: string[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled" && (result.value.ok || result.value.status === 204)) {
        deleted.push(ids[i]);
      } else {
        failed.push(ids[i]);
      }
    });

    if (deleted.length > 0) {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }

    return { deleted, failed };
  };

  return { deleteTasks };
}
