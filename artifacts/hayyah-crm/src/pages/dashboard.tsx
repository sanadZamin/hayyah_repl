import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { maxRevenueInRows, parseRevenueByMonth } from "@/lib/stats-revenue";
import { useTasks, useAllTasksForProviderCounts, getProviderTaskCountBuckets, useUnassignedTasks, useAssignTask } from "@/hooks/use-tasks";
import { useTechnicians } from "@/hooks/use-technicians";
import type { Technician } from "@workspace/api-client-react";
import { specializationLabel } from "@/components/specialization-select";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Star,
  Plus,
  UserPlus,
  Wrench,
  MoreVertical,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { NewOrderDialog } from "@/components/new-order-dialog";

const STATUS_COLORS: Record<string, string> = {
  Completed:   "bg-[#53ffb0]/20 text-[#0d2270]",
  "In Progress": "bg-[#0088fb]/20 text-[#0088fb]",
  Pending:     "bg-amber-100 text-amber-800",
  Cancelled:   "bg-red-100 text-red-800",
};

function formatOrderStatus(status: string | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "FULFILLED" || s === "COMPLETED") return "Completed";
  if (s === "FULFILLING" || s === "IN_PROGRESS") return "In Progress";
  if (s === "CANCELED" || s === "CANCELLED") return "Cancelled";
  if (s === "AWAITING_PAYMENT" || s === "NEW" || s === "PAID") return "Pending";
  return "Pending";
}

function formatTaskTime(value: number | undefined): string {
  if (!value) return "—";
  const ms = value < 10_000_000_000 ? value * 1000 : value;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDisplay(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "—";
}

export default function Dashboard() {
  type UnassignedSortKey = "task" | "customer" | "scheduled" | "status";
  const { data } = useDashboardMetrics();
  const { data: tasksPage, isLoading: isRecentOrdersLoading, isError: isRecentOrdersError } = useTasks(0, 5);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [unassignedPageSize] = useState(10);
  const {
    data: unassignedTasksPage,
    isLoading: isUnassignedLoading,
    isError: isUnassignedError,
  } = useUnassignedTasks(unassignedPage - 1, unassignedPageSize);
  const { data: techData, isLoading: isTopProvidersLoading } = useTechnicians();
  const assignTask = useAssignTask();
  const hasProviders = Boolean(techData && techData.length > 0);
  const { data: allTasks } = useAllTasksForProviderCounts({ enabled: hasProviders });
  const [, setLocation] = useLocation();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [unassignedSortKey, setUnassignedSortKey] = useState<UnassignedSortKey>("scheduled");
  const [unassignedSortDir, setUnassignedSortDir] = useState<"asc" | "desc">("desc");
  const [selectedUnassignedTaskId, setSelectedUnassignedTaskId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");

  const tasksByState = (data?.tasksByState ?? {}) as Record<string, number>;
  const totalOrders    = typeof data?.totalTaskCount === "number" ? data.totalTaskCount : null;
  const totalCustomers = typeof data?.customerCount  === "number" ? data.customerCount  : null;
  const activeOrders   = data
    ? (tasksByState.AWAITING_PAYMENT ?? 0) + (tasksByState.PAID ?? 0) + (tasksByState.FULFILLING ?? 0)
    : null;

  const fmt = (v: number | null, prefix = "") =>
    v !== null ? `${prefix}${v.toLocaleString()}` : "—";

  const revenueByMonth = useMemo(() => parseRevenueByMonth(data as Record<string, unknown> | undefined), [data]);

  const maxRevenue = useMemo(() => maxRevenueInRows(revenueByMonth), [revenueByMonth]);

  const stats = [
    { label: "Total Orders",        value: fmt(totalOrders),    icon: ShoppingBag },
    { label: "Active Customers",    value: fmt(totalCustomers), icon: Users },
    { label: "Active Orders",       value: fmt(activeOrders),   icon: DollarSign },
    { label: "Avg. Service Rating", value: "—",                 icon: Star },
  ];

  const recentOrders = (tasksPage?.content ?? []).map((task) => ({
    id: task.id ? `#${task.id}` : "—",
    customer: task.customerName || "—",
    service: task.title || task.taskType || "—",
    provider: task.technicianName || "Unassigned",
    status: formatOrderStatus(task.orderStatus),
    amount: "—",
    date: formatTaskTime(task.taskDateTime),
  }));
  const urgentUnassigned = useMemo(() => {
    const rows = [...(unassignedTasksPage?.content ?? [])];
    rows.sort((a, b) => {
      const dir = unassignedSortDir === "asc" ? 1 : -1;
      if (unassignedSortKey === "scheduled") {
        return (Number(a.taskDateTime ?? 0) - Number(b.taskDateTime ?? 0)) * dir;
      }
      if (unassignedSortKey === "customer") {
        return (a.customerName ?? "").localeCompare(b.customerName ?? "") * dir;
      }
      if (unassignedSortKey === "status") {
        return formatOrderStatus(a.orderStatus).localeCompare(formatOrderStatus(b.orderStatus)) * dir;
      }
      const aTask = a.title || a.taskType || "";
      const bTask = b.title || b.taskType || "";
      return aTask.localeCompare(bTask) * dir;
    });
    return rows;
  }, [unassignedSortDir, unassignedSortKey, unassignedTasksPage?.content]);

  const unassignedTotalPages = Math.max(1, unassignedTasksPage?.totalPages ?? 1);
  const unassignedTotalElements = unassignedTasksPage?.totalElements ?? urgentUnassigned.length;
  const selectedUnassignedTask = useMemo(
    () => (unassignedTasksPage?.content ?? []).find((t) => t.id === selectedUnassignedTaskId) ?? null,
    [selectedUnassignedTaskId, unassignedTasksPage?.content],
  );
  const providerOptions = useMemo(
    () =>
      (techData ?? []).map((t) => ({
        id: String(t.id),
        label: `${t.firstName} ${t.lastName}`.trim() || t.email,
        specialization: specializationLabel(t.specialization),
      })),
    [techData],
  );
  useEffect(() => {
    if (!selectedUnassignedTaskId) {
      setSelectedTechnicianId("");
    }
  }, [selectedUnassignedTaskId]);
  useEffect(() => {
    if (unassignedPage > unassignedTotalPages) {
      setUnassignedPage(unassignedTotalPages);
    }
  }, [unassignedPage, unassignedTotalPages]);

  function onUnassignedSort(col: UnassignedSortKey) {
    if (unassignedSortKey === col) {
      setUnassignedSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setUnassignedSortKey(col);
    setUnassignedSortDir(col === "scheduled" ? "desc" : "asc");
  }

  function SortIcon({ col }: { col: UnassignedSortKey }) {
    if (unassignedSortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return unassignedSortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--hayyah-blue)" }} />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--hayyah-blue)" }} />
    );
  }

  const topProviders = useMemo(() => {
    if (!techData?.length) return [];
    const providers = techData.map((t: Technician) => ({
      id: String(t.id),
      userId: t.userId,
      name: `${t.firstName} ${t.lastName}`.trim() || t.email,
      service: specializationLabel(t.specialization),
      rating: t.rating != null && Number.isFinite(t.rating) ? t.rating : 0,
    }));

    const buckets = allTasks
      ? getProviderTaskCountBuckets(
          allTasks,
          providers.map((p) => ({ id: p.id, userId: p.userId, name: p.name })),
        )
      : new Map<string, { completed: number; active: number }>();

    return providers
      .map((p) => ({ ...p, jobs: buckets.get(p.id)?.completed ?? 0 }))
      .sort((a, b) => (b.rating - a.rating) || (b.jobs - a.jobs))
      .slice(0, 3);
  }, [allTasks, techData]);

  return (
    <AppLayout activeNav="dashboard">
      <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/customers")} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium bg-white transition-colors hover:bg-gray-50" style={{ color: "var(--hayyah-navy)", borderColor: "#e2e8f0" }}>
              <UserPlus className="w-4 h-4" /> Add Customer
            </button>
            <button onClick={() => setLocation("/providers")} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium bg-white transition-colors hover:bg-gray-50" style={{ color: "var(--hayyah-navy)", borderColor: "#e2e8f0" }}>
              <Wrench className="w-4 h-4" /> Assign Provider
            </button>
            <button onClick={() => setNewOrderOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: "var(--hayyah-blue)" }}>
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl" style={{ background: "var(--hayyah-blue-light)" }}>
                    <Icon className="w-5 h-5" style={{ color: "var(--hayyah-blue)" }} />
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    Live
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                  <p className="text-2xl font-bold mt-1" style={{ color: "var(--hayyah-navy)" }}>{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--hayyah-blue)" }} />
                Revenue Overview
              </h2>
              <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50 px-2 py-1 outline-none">
                <option>2024</option><option>2023</option>
              </select>
            </div>
            <div className="p-6">
              {revenueByMonth && revenueByMonth.length > 0 ? (
                <div className="h-64 flex items-end justify-between gap-2 pb-6 relative">
                  <div className="absolute left-12 right-0 top-2 border-t border-dashed border-gray-200" />
                  <div className="absolute left-12 right-0 top-[33%] border-t border-dashed border-gray-200" />
                  <div className="absolute left-12 right-0 top-[66%] border-t border-dashed border-gray-200" />
                  <div className="absolute left-12 right-0 bottom-6 border-t border-dashed border-gray-200" />
                  <div className="w-full flex justify-between items-end pl-6 relative z-10 h-full">
                    {revenueByMonth.map((row, i) => (
                      <div key={`${row.month}-${i}`} className="flex flex-col items-center gap-2 w-full">
                        <div
                          className="w-full max-w-[28px] mx-auto rounded-t-md relative group transition-all"
                          style={{
                            height: `${Math.max(4, (row.value / maxRevenue) * 100)}%`,
                            background: i === revenueByMonth.length - 1 ? "var(--hayyah-blue)" : "var(--hayyah-blue-light)",
                          }}
                          title={`${row.month}: ${row.value.toLocaleString()}`}
                        />
                        <span className="text-xs text-gray-500 font-medium">{row.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
                  Revenue analytics unavailable.
                </div>
              )}
            </div>
          </div>

          {/* Top Providers */}
          <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--hayyah-mint)" }} />
                Top Providers
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {isTopProvidersLoading && Array.from({ length: 3 }).map((_, i) => (
                <div key={`sk-${i}`} className="p-5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-10 bg-gray-100 rounded" />
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
              {!isTopProvidersLoading && topProviders.map((provider, i) => (
                <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "var(--hayyah-navy)" }}>
                      {provider.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: "var(--hayyah-navy)" }}>{provider.name}</h4>
                      <p className="text-xs text-gray-500">{provider.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-semibold" style={{ color: "var(--hayyah-blue)" }}>
                      <Star className="w-3 h-3 fill-current" /> {provider.rating}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{provider.jobs} jobs</p>
                  </div>
                </div>
              ))}
              {!isTopProvidersLoading && topProviders.length === 0 && (
                <div className="p-6 text-sm text-gray-500 text-center">No providers found.</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-50">
              <button onClick={() => setLocation("/providers")} className="w-full text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: "var(--hayyah-blue)" }}>
                View All Providers
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
              <div className="w-1 h-5 rounded-full" style={{ background: "var(--hayyah-blue)" }} />
              Recent Orders
            </h2>
            <button onClick={() => setLocation("/orders")} className="text-sm font-medium" style={{ color: "var(--hayyah-blue)" }}>View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {["Order ID", "Customer", "Service", "Provider", "Status", "Amount", ""].map((h) => (
                    <th key={h} className="font-semibold text-gray-500 py-3 px-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isRecentOrdersLoading && (
                  <tr>
                    <td colSpan={7} className="py-6 px-4 text-center text-sm text-gray-500">Loading recent orders...</td>
                  </tr>
                )}
                {isRecentOrdersError && (
                  <tr>
                    <td colSpan={7} className="py-6 px-4 text-center text-sm text-red-600">Could not load recent orders.</td>
                  </tr>
                )}
                {!isRecentOrdersLoading && !isRecentOrdersError && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 px-4 text-center text-sm text-gray-500">No recent orders found.</td>
                  </tr>
                )}
                {!isRecentOrdersLoading && !isRecentOrdersError && recentOrders.map((order, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium" style={{ color: "var(--hayyah-navy)" }}>{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{order.customer}</div>
                      <div className="text-xs text-gray-400">{order.date}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{order.service}</td>
                    <td className="py-3 px-4 text-gray-600">{order.provider}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>{order.status}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{order.amount}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Urgent Unassigned Tasks */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
              <div className="w-1 h-5 rounded-full bg-red-500" />
              Urgent Unassigned Tasks
            </h2>
            <button
              onClick={() => setLocation("/orders")}
              className="text-sm font-medium inline-flex items-center gap-1"
              style={{ color: "var(--hayyah-blue)" }}
            >
              <AlertTriangle className="w-4 h-4" />
              Review in Tasks
            </button>
          </div>
          <div>
            {isUnassignedLoading && (
              <div className="p-6 text-sm text-gray-500 text-center">Loading unassigned tasks...</div>
            )}
            {isUnassignedError && !isUnassignedLoading && (
              <div className="p-6 text-sm text-red-600 text-center">Could not load urgent unassigned tasks.</div>
            )}
            {!isUnassignedLoading && !isUnassignedError && urgentUnassigned.length === 0 && (
              <div className="p-6 text-sm text-gray-500 text-center">No unassigned urgent tasks.</div>
            )}
            {!isUnassignedLoading && !isUnassignedError && urgentUnassigned.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => onUnassignedSort("task")}
                          className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Task <SortIcon col="task" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => onUnassignedSort("customer")}
                          className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Customer <SortIcon col="customer" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => onUnassignedSort("scheduled")}
                          className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Scheduled <SortIcon col="scheduled" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => onUnassignedSort("status")}
                          className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Status <SortIcon col="status" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentUnassigned.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedUnassignedTaskId(task.id)}
                      >
                        <td className="py-3 px-4">
                          <p className="font-semibold" style={{ color: "var(--hayyah-navy)" }}>
                            {task.title || task.taskType || "Untitled task"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{task.id ? `#${task.id}` : "—"}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{task.customerName || "Unknown customer"}</td>
                        <td className="py-3 px-4 text-gray-600">{formatTaskTime(task.taskDateTime)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[formatOrderStatus(task.orderStatus)] ?? "bg-gray-100 text-gray-800"}`}>
                            {formatOrderStatus(task.orderStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                  <p className="text-xs text-gray-500">
                    Showing {urgentUnassigned.length} of {unassignedTotalElements.toLocaleString()} unassigned tasks
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                      disabled={unassignedPage <= 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-gray-600">
                      Page {unassignedPage} of {unassignedTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnassignedPage((p) => Math.min(unassignedTotalPages, p + 1))}
                      disabled={unassignedPage >= unassignedTotalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedUnassignedTask && (
        <div className="fixed inset-y-0 right-0 w-[420px] max-w-[96vw] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--hayyah-navy)" }}>
                Task #{selectedUnassignedTask.id}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{selectedUnassignedTask.customerName || "Unknown customer"}</p>
            </div>
            <button
              className="p-1.5 rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedUnassignedTaskId(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Title / Type</p>
                <p className="font-medium text-gray-900 mt-1">
                  {selectedUnassignedTask.title || selectedUnassignedTask.taskType || "Untitled task"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium text-gray-900 mt-1">{formatOrderStatus(selectedUnassignedTask.orderStatus)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Scheduled at</p>
                <p className="font-medium text-gray-900 mt-1">{formatTaskTime(selectedUnassignedTask.taskDateTime)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Description</p>
                <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                  {selectedUnassignedTask.description || "—"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Task Details</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Task ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{toDisplay(selectedUnassignedTask.id)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Customer Name</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{toDisplay(selectedUnassignedTask.customerName)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Order Status</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{toDisplay(selectedUnassignedTask.orderStatus)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Task Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {toDisplay(selectedUnassignedTask.taskType || selectedUnassignedTask.title)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">User ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{toDisplay(selectedUnassignedTask.userID)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Service ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{toDisplay(selectedUnassignedTask.serviceID)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Scheduled Timestamp</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatTaskTime(Number(selectedUnassignedTask.taskDateTime))}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Created Timestamp</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatTaskTime(Number(selectedUnassignedTask.created_at))}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] text-gray-500">Assigned Technician</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {toDisplay(selectedUnassignedTask.technicianName || selectedUnassignedTask.technicianId)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
            <label className="block">
              <span className="text-xs text-gray-500">Assign Provider</span>
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none bg-white"
                style={{ borderColor: "#e2e8f0" }}
              >
                <option value="">Select provider</option>
                {providerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} - {p.specialization}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedTechnicianId || assignTask.isPending}
              onClick={async () => {
                if (!selectedTechnicianId || !selectedUnassignedTask) return;
                await assignTask.mutateAsync({
                  taskId: selectedUnassignedTask.id,
                  technicianId: selectedTechnicianId,
                });
                setSelectedUnassignedTaskId(null);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--hayyah-blue)" }}
            >
              {assignTask.isPending ? "Assigning..." : "Assign Provider"}
            </button>
          </div>
        </div>
      )}

      <NewOrderDialog open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </AppLayout>
  );
}
