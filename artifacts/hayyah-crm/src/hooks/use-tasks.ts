import { useQuery } from "@tanstack/react-query";
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
