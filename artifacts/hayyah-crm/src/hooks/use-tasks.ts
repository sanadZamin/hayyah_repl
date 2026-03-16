import { useQuery } from "@tanstack/react-query";

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

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("hayyah_token");
    if (!stored) return null;
    return (JSON.parse(stored) as { access_token?: string }).access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchTasks(): Promise<Task[]> {
  const token = getToken();
  const res = await fetch("/api/tasks", {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      Accept: "application/json",
    },
  });
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
