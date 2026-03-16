import { useQuery } from "@tanstack/react-query";

export interface HayyahUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  enabled?: boolean;
  createdTimestamp?: number;
  [key: string]: unknown;
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

async function fetchUsers(page = 0, size = 50): Promise<HayyahUser[]> {
  const token = getToken();
  const res = await fetch(`/api/users?page=${page}&size=${size}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error_description || `Failed to fetch users (${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.users)) return data.users;
  return [];
}

export function useUsers(page = 0, size = 50) {
  return useQuery<HayyahUser[], Error>({
    queryKey: ["users", page, size],
    queryFn: () => fetchUsers(page, size),
    staleTime: 30_000,
    retry: 1,
  });
}
