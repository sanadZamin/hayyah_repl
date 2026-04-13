import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { apiPath } from "@/lib/api-path";

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

export interface TaskEvent {
  id: string;
  orderId: string;
  fromState: string;
  toState: string;
  reasonCode: string;
  actorType: string;
  actorId: string | null;
  correlationId: string | null;
  idempotencyKey: string | null;
  createdAt: number;
}

export interface PaginatedTasksResponse {
  content: Task[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

async function fetchTasks(page: number, size: number): Promise<PaginatedTasksResponse> {
  const res = await apiFetch(apiPath(`/tasks?page=${page}&size=${size}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch tasks (${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return {
      content: data,
      page,
      size,
      totalElements: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }
  return {
    content: data.content ?? data.data ?? [],
    page: Number(data.page ?? page),
    size: Number(data.size ?? size),
    totalElements: Number(data.totalElements ?? (data.content?.length ?? 0)),
    totalPages: Number(data.totalPages ?? 1),
    hasNext: Boolean(data.hasNext),
    hasPrevious: Boolean(data.hasPrevious),
  };
}

async function fetchTaskEvents(taskId: string): Promise<TaskEvent[]> {
  const res = await apiFetch(apiPath(`/tasks/${taskId}/events`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch task events (${res.status})`);
  }
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.content ?? data.data ?? []);
  return [...list].sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
}

export function useTasks(page: number, size: number) {
  return useQuery<PaginatedTasksResponse, Error>({
    queryKey: ["tasks", page, size],
    queryFn: () => fetchTasks(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTaskEvents(taskId: string | null) {
  return useQuery<TaskEvent[], Error>({
    queryKey: ["task-events", taskId],
    queryFn: () => fetchTaskEvents(taskId as string),
    enabled: !!taskId,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useDeleteTasks() {
  const queryClient = useQueryClient();

  const deleteTasks = async (ids: string[]): Promise<{ deleted: string[]; failed: string[] }> => {
    const results = await Promise.allSettled(
      ids.map(id => apiFetch(apiPath(`/tasks/${id}`), { method: "DELETE" }))
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
