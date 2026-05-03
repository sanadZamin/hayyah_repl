import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { apiPath } from "@/lib/api-path";
import { useToast } from "@/hooks/use-toast";

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
  /** Hayyah task field when assigned to a provider profile (matches `Technician.id`). */
  technicianId?: string | number;
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

export async function fetchTasks(page: number, size: number): Promise<PaginatedTasksResponse> {
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

export async function fetchUnassignedTasks(page: number, size: number): Promise<PaginatedTasksResponse> {
  const res = await apiFetch(apiPath(`/tasks/unassigned?page=${page}&size=${size}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch unassigned tasks (${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return {
      content: data as Task[],
      page,
      size,
      totalElements: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }
  return {
    content: (data.content ?? data.data ?? []) as Task[],
    page: Number(data.page ?? page),
    size: Number(data.size ?? size),
    totalElements: Number(data.totalElements ?? (data.content?.length ?? 0)),
    totalPages: Number(data.totalPages ?? 1),
    hasNext: Boolean(data.hasNext),
    hasPrevious: Boolean(data.hasPrevious),
  };
}

export function useUnassignedTasks(page: number, size: number) {
  return useQuery<PaginatedTasksResponse, Error>({
    queryKey: ["tasks", "unassigned", page, size],
    queryFn: () => fetchUnassignedTasks(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}

const MAX_TASK_PAGES = 100;

/** Loads all task pages (for aggregates such as per-provider counts on the Providers screen). */
export async function fetchAllTasks(pageSize = 200): Promise<Task[]> {
  const all: Task[] = [];
  for (let page = 0, guard = 0; guard < MAX_TASK_PAGES; guard++) {
    const batch = await fetchTasks(page, pageSize);
    all.push(...batch.content);
    if (!batch.hasNext || batch.content.length === 0) break;
    page++;
  }
  return all;
}

export function useAllTasksForProviderCounts(
  options?: Pick<UseQueryOptions<Task[], Error>, "enabled">,
) {
  return useQuery<Task[], Error>({
    queryKey: ["tasks", "all-for-provider-counts"],
    queryFn: () => fetchAllTasks(200),
    staleTime: 30_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCompletedTaskStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "FULFILLED" || s === "COMPLETED";
}

function isCanceledTaskStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === "CANCELED" || s === "CANCELLED";
}

function isActiveTaskStatus(status: string): boolean {
  if (!status.trim()) return false;
  if (isCanceledTaskStatus(status)) return false;
  if (isCompletedTaskStatus(status)) return false;
  return true;
}

type ProviderTaskCountRow = { id: string; userId?: string; name: string };

/**
 * Maps tasks to provider profile ids: `technicianId` → `Technician.id`, else `technicianUserId` → `Technician.userId`, else normalized `technicianName` → provider name.
 */
export function getProviderTaskCountBuckets(
  tasks: Task[],
  providers: ReadonlyArray<ProviderTaskCountRow>,
): Map<string, { completed: number; active: number }> {
  const byId = new Map<string, { completed: number; active: number }>();
  for (const p of providers) {
    byId.set(String(p.id), { completed: 0, active: 0 });
  }
  const nameToProviderId = new Map<string, string>();
  for (const p of providers) {
    nameToProviderId.set(normName(p.name), String(p.id));
  }

  for (const t of tasks) {
    const status = t.orderStatus ?? "";
    const completed = isCompletedTaskStatus(status);
    const active = isActiveTaskStatus(status);
    if (!completed && !active) continue;

    const ext = t as Task & Record<string, unknown>;
    let pid: string | undefined;

    const techIdRaw = ext.technicianId ?? ext.technician_id;
    if (techIdRaw !== undefined && techIdRaw !== null && String(techIdRaw) !== "") {
      const idStr = String(techIdRaw);
      if (byId.has(idStr)) pid = idStr;
    }

    const techUserRaw = ext.technicianUserId ?? ext.technician_user_id;
    if (!pid && typeof techUserRaw === "string" && techUserRaw) {
      const match = providers.find((p) => p.userId === techUserRaw);
      if (match) pid = String(match.id);
    }

    if (!pid && t.technicianName) {
      pid = nameToProviderId.get(normName(t.technicianName));
    }

    if (!pid) continue;
    const bucket = byId.get(pid);
    if (!bucket) continue;
    if (completed) bucket.completed += 1;
    else bucket.active += 1;
  }

  return byId;
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

export function useAssignTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, technicianId }: { taskId: string; technicianId: string }) => {
      const encodedTaskId = encodeURIComponent(taskId);
      const encodedTechId = encodeURIComponent(technicianId);
      const attempts: Array<{ url: string; body: Record<string, unknown> }> = [
        {
          url: apiPath(`/tasks/${encodedTaskId}/assign`),
          body: { technicianId },
        },
        {
          url: apiPath(`/tasks/${encodedTaskId}/assign/${encodedTechId}`),
          body: {},
        },
        {
          url: apiPath(`/tasks/${encodedTaskId}/assign?technicianId=${encodedTechId}`),
          body: {},
        },
        {
          url: apiPath("/tasks/assign"),
          body: { taskId, technicianId },
        },
      ];

      let lastStatus = 0;
      let lastError = "Failed to assign task.";
      for (const attempt of attempts) {
        const res = await apiFetch(attempt.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attempt.body),
        });
        if (res.ok) {
          return res.json().catch(() => ({}));
        }
        lastStatus = res.status;
        const err = await res.json().catch(() => ({}));
        lastError =
          (err as Record<string, string>).error_description ||
          (err as Record<string, string>).message ||
          `Failed to assign task (${res.status})`;
      }

      throw new Error(lastStatus ? `${lastError} (HTTP ${lastStatus})` : lastError);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", "unassigned"] }),
      ]);
      toast({ title: "Task assigned successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not assign task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
