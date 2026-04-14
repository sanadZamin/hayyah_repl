import { useState, useMemo, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTasks, useDeleteTasks, useTaskEvents } from "@/hooks/use-tasks";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Edit2, Download, Calendar, X, Wrench, MapPin, User, Clock, CheckCircle2, Loader2, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Plus, RefreshCcw } from "lucide-react";
import { NewOrderDialog } from "@/components/new-order-dialog";
import { dashboardStatsApiPath } from "@/hooks/use-dashboard";
import { format } from "date-fns";

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAID: "Paid",
  FULFILLING: "Fulfilling",
  FULFILLED: "Fulfilled",
  CANCELED: "Canceled",
  REFUNDED: "Refunded",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function getStatusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "FULFILLED": case "COMPLETED": case "Completed":   return "bg-[#53ffb0]/20 text-emerald-800";
    case "PAID":                                             return "bg-teal-100 text-teal-800";
    case "FULFILLING": case "IN_PROGRESS": case "In Progress": return "bg-[#0088fb]/20 text-[#0088fb]";
    case "NEW":                                              return "bg-purple-100 text-purple-800";
    case "AWAITING_PAYMENT":                                 return "bg-amber-100 text-amber-800";
    case "CANCELED": case "CANCELLED": case "Cancelled":    return "bg-red-100 text-red-800";
    case "REFUNDED":                                         return "bg-gray-100 text-gray-700";
    default:                                                 return "bg-gray-100 text-gray-800";
  }
}

function formatDate(ms: number) {
  if (!ms || ms <= 0) return "—";
  try { return format(new Date(ms), "MMM d, h:mm a"); } catch { return "—"; }
}



type SortCol = "id" | "customer" | "tasktype" | "service" | "date" | "status";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 ml-1 inline" style={{ color: "var(--hayyah-blue)" }} />
    : <ChevronDown className="w-3.5 h-3.5 ml-1 inline" style={{ color: "var(--hayyah-blue)" }} />;
}

export default function Orders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: tasksPage, isLoading, isError, error } = useTasks(page - 1, pageSize);
  const { data: metrics } = useDashboardMetrics();
  const { deleteTasks } = useDeleteTasks();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(() => new Set());
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showNewTask, setShowNewTask] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: taskEvents, isLoading: isEventsLoading, isError: isEventsError, error: eventsError } = useTaskEvents(selectedId);
  const tasks = tasksPage?.content ?? [];

  const refreshOrdersData = useCallback(async () => {
    const jobs = [
      queryClient.refetchQueries({ queryKey: ["tasks"] }),
      queryClient.refetchQueries({ queryKey: [dashboardStatsApiPath] }),
    ];
    if (selectedId) {
      jobs.push(queryClient.refetchQueries({ queryKey: ["task-events", selectedId] }));
    }
    await Promise.all(jobs);
  }, [queryClient, selectedId]);

  async function handleRefresh() {
    setSelectedRows([]);
    setIsRefreshing(true);
    try {
      await refreshOrdersData();
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleDeleteSelected() {
    setIsDeleting(true);
    setDeleteError(null);
    const { deleted, failed } = await deleteTasks(selectedRows);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    if (deleted.length > 0) setSelectedRows(prev => prev.filter(id => !deleted.includes(id)));
    if (failed.length > 0) setDeleteError(`${failed.length} task(s) could not be deleted.`);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const tasksByState = (metrics?.tasksByState ?? {}) as Record<string, number>;
  const statTabs = [
    { label: "Total",            value: metrics?.totalTaskCount as number | undefined,  color: "#0d2270" },
    { label: "New",              value: tasksByState["NEW"],                              color: "#7c3aed" },
    { label: "Awaiting Payment", value: tasksByState["AWAITING_PAYMENT"],                color: "#d97706" },
    { label: "Fulfilling",       value: tasksByState["FULFILLING"],                      color: "#0088fb" },
    { label: "Fulfilled",        value: tasksByState["FULFILLED"],                       color: "#059669" },
    { label: "Canceled",         value: tasksByState["CANCELED"],                        color: "#dc2626" },
  ];

  const orders = useMemo(() => {
    if (!tasks) return [];
    return tasks.map(t => ({
      id: t.id,
      customer: t.customerName ?? "—",
      service: t.description ?? "—",
      taskType: t.title ?? "—",
      provider: t.technicianName ?? "Unassigned",
      date: formatDate(t.taskDateTime),
      status: t.orderStatus ?? "NEW",
      amount: "—",
      rawTask: t,
    }));
  }, [tasks]);

  const serviceTypeOptions = useMemo(() => {
    const uniq = new Set<string>();
    for (const o of orders) {
      const v = (o.taskType ?? "").trim();
      if (v) uniq.add(v);
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const statusOptions = useMemo(() => {
    const uniq = new Set<string>();
    for (const o of orders) {
      if (o.status) uniq.add(o.status);
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = orders.filter(o => {
      const matchSearch = !q || o.customer.toLowerCase().includes(q) || o.service.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      const matchStatus = selectedStatuses.size === 0 || selectedStatuses.has(o.status);
      const matchServiceType = selectedServiceTypes.size === 0 || selectedServiceTypes.has(o.taskType);
      return matchSearch && matchStatus && matchServiceType;
    });
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "id")       { av = a.id;                            bv = b.id; }
      if (sortCol === "customer") { av = a.customer;                      bv = b.customer; }
      if (sortCol === "tasktype") { av = (a as any).taskType ?? "";        bv = (b as any).taskType ?? ""; }
      if (sortCol === "service")  { av = a.service;                       bv = b.service; }
      if (sortCol === "date")     { av = a.date;                          bv = b.date; }
      if (sortCol === "status")   { av = a.status;                        bv = b.status; }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [orders, search, selectedStatuses, selectedServiceTypes, sortCol, sortDir]);

  const totalPages = Math.max(1, tasksPage?.totalPages ?? 1);
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const totalElements = tasksPage?.totalElements ?? filtered.length;
  const pagedRows = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);


  const toggleRow = (id: string) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const toggleAll = () => {
    const pageIds = pagedRows.map(o => o.id);
    const allOnPageSelected = pageIds.every(id => selectedRows.includes(id));
    setSelectedRows(prev =>
      allOnPageSelected
        ? prev.filter(id => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleServiceType = (serviceType: string) => {
    setSelectedServiceTypes((prev) => {
      const next = new Set(prev);
      if (next.has(serviceType)) next.delete(serviceType);
      else next.add(serviceType);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedStatuses(new Set());
    setSelectedServiceTypes(new Set());
  };

  const hasActiveFilters =
    search.trim() !== "" || selectedStatuses.size > 0 || selectedServiceTypes.size > 0;

  return (
    <AppLayout activeNav="orders">
      <div className="flex h-full gap-6 relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="w-56 flex-shrink-0 hidden lg:flex flex-col bg-white rounded-2xl shadow-sm p-5 self-start sticky top-0">
          <h2 className="font-bold mb-6" style={{ color: "var(--hayyah-navy)" }}>Filters</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Service Type</h3>
              {serviceTypeOptions.length === 0 ? (
                <p className="text-xs text-gray-500">No task types found.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {serviceTypeOptions.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        style={{ accentColor: "var(--hayyah-blue)" }}
                        checked={selectedServiceTypes.has(s)}
                        onChange={() => toggleServiceType(s)}
                      />
                      <span className="break-words">{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Status</h3>
              {statusOptions.length === 0 ? (
                <p className="text-xs text-gray-500">No statuses in current list.</p>
              ) : (
                <div className="space-y-2.5">
                  {statusOptions.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        style={{ accentColor: "var(--hayyah-blue)" }}
                        checked={selectedStatuses.has(status)}
                        onChange={() => toggleStatus(status)}
                      />
                      {getStatusLabel(status)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset filters
            </button>
          </div>
        </div>
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedId ? "lg:pr-[420px]" : ""}`}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Tasks</h1>
              <button
                onClick={() => { setShowNewTask(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--hayyah-blue)" }}
              >
                <Plus className="w-4 h-4" /> New Task
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-1 mb-4">Manage and track all service tasks</p>
            <div className="flex flex-wrap gap-3">
              {statTabs.map((s) => (
                <div key={s.label} className="rounded-xl bg-white shadow-sm flex-1 min-w-[110px] px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{s.label}</span>
                  <div className="text-xl font-bold mt-1" style={{ color: s.color }}>
                    {s.value !== undefined ? s.value.toLocaleString() : <span className="text-gray-300 text-sm">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm flex flex-col overflow-hidden relative" style={{ minHeight: 0 }}>
            {/* Bulk bar */}
            {selectedRows.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-20 text-white p-3 flex items-center justify-between px-6" style={{ background: "var(--hayyah-navy)" }}>
                <span className="text-sm font-medium">{selectedRows.length} task{selectedRows.length !== 1 ? "s" : ""} selected</span>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                    className="px-3 py-1 rounded-lg text-sm flex items-center gap-1.5 font-medium transition-colors hover:opacity-90"
                    style={{ background: "rgba(239,68,68,0.25)", color: "#fca5a5" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                  <button onClick={() => setSelectedRows([])} className="p-1 rounded text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Delete confirm dialog */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 rounded-2xl">
                <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#fef2f2" }}>
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Delete {selectedRows.length} task{selectedRows.length !== 1 ? "s" : ""}?</h3>
                      <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
                      style={{ background: "#dc2626" }}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center z-10">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border-0" />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-600 bg-white" style={{ borderColor: "#e2e8f0" }}>
                <Calendar className="w-4 h-4" /> Date Range
              </button>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-60"
                style={{ borderColor: "#e2e8f0" }}
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                {isRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {/* Loading/Error states */}
            {isLoading && (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--hayyah-blue)" }} />
              </div>
            )}
            {isError && (
              <div className="p-6 flex items-center gap-3 bg-amber-50 border-b border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Could not load task data</p>
                  <p className="text-xs text-amber-600 mt-0.5">{error?.message}</p>
                </div>
                <button onClick={handleRefresh} className="text-xs font-medium text-amber-700 hover:underline">Retry</button>
              </div>
            )}

            {/* Delete error */}
            {deleteError && (
              <div className="p-4 flex items-center gap-3 bg-red-50 border-b border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 flex-1">{deleteError}</p>
                <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10" style={{ boxShadow: "0 1px 0 #f3f4f6" }}>
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={pagedRows.length > 0 && pagedRows.every(row => selectedRows.includes(row.id))}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    {(["id","customer","tasktype","service","date","status","actions"] as const).map((col) => {
                      const label: Record<string, string> = { id: "Task ID", customer: "Customer", tasktype: "Task Type", service: "Technician & Service", date: "Schedule", status: "Status", actions: "" };
                      const sortable = (["id","customer","tasktype","service","date","status"] as const).includes(col as SortCol);
                      return (
                        <th key={col} className={`font-semibold text-gray-500 py-3 px-4 text-left select-none ${sortable ? "cursor-pointer hover:text-gray-800" : ""}`}
                          onClick={() => sortable && handleSort(col as SortCol)}>
                          {label[col]}
                          {sortable && <SortIcon col={col as SortCol} sortCol={sortCol} sortDir={sortDir} />}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-gray-400">
                        {isError ? "Failed to load tasks." : tasks.length === 0 ? "No tasks found." : "No tasks match your filters on this page."}
                      </td>
                    </tr>
                  )}
                  {pagedRows.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors" style={{ background: selectedRows.includes(order.id) ? "rgba(0,136,251,0.04)" : undefined }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.includes(order.id)} onChange={() => toggleRow(order.id)} className="rounded" />
                      </td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap" style={{ color: "var(--hayyah-navy)" }}>
                        <span className="font-mono text-xs">{order.id}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{order.customer}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.taskType || "—"}</td>
                      <td className="py-3 px-4">
                        <div className={`font-medium text-sm ${order.provider === "Unassigned" ? "text-amber-600" : "text-gray-800"}`}>{order.provider}</div>
                        <div className="text-xs mt-0.5 text-gray-500">{order.service}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>{getStatusLabel(order.status)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--hayyah-blue)] transition-colors" onClick={() => setSelectedId(order.id === selectedId ? null : order.id)}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {!isLoading && totalElements > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalElements)} of {totalElements} tasks
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={String(pageSize)}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1.5 rounded-lg border text-xs text-gray-600 bg-white outline-none"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <option value="10">10 / page</option>
                    <option value="20">20 / page</option>
                    <option value="50">50 / page</option>
                  </select>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg border text-xs text-gray-600 disabled:opacity-40"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border text-xs text-gray-600 disabled:opacity-40"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Drawer */}
        {selectedId && (
          <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:rounded-2xl lg:border lg:shadow-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {(() => {
              const order = orders.find(o => o.id === selectedId);
              if (!order) return null;
              return (
                <>
                  <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "var(--hayyah-navy)" }}>Task {order.id}</h2>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>{getStatusLabel(order.status)}</span>
                        <span className="text-sm text-gray-500">• {order.date}</span>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600" onClick={() => setSelectedId(null)}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Timeline */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Task History</h3>
                      {isEventsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading task events...
                        </div>
                      ) : isEventsError ? (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                          <AlertCircle className="w-4 h-4 mt-0.5" />
                          <span>{eventsError?.message || "Failed to load task history."}</span>
                        </div>
                      ) : !taskEvents || taskEvents.length === 0 ? (
                        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                          No task history events found.
                        </div>
                      ) : (
                        <div className="relative pl-3 space-y-4" style={{ borderLeft: "2px solid #f3f4f6", marginLeft: 15 }}>
                          {[...taskEvents]
                            .sort((a, b) => a.createdAt - b.createdAt)
                            .map((evt) => (
                              <div key={evt.id} className="relative flex gap-4" style={{ marginLeft: -22 }}>
                                <div className="w-[10px] h-[10px] rounded-full ring-4 ring-white z-10 flex-shrink-0 mt-1" style={{ background: "#0088fb" }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {evt.fromState} to {evt.toState}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{evt.reasonCode || "No reason provided"}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    {formatDate(evt.createdAt)} - {evt.actorType || "Unknown actor"}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Service Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Service Type</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{order.taskType || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">—</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--hayyah-blue)" }}>{order.customer}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Scheduled At</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{order.date}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Service Fee</span><span>{order.amount}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>VAT (15%)</span><span>—</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                          <span>Total</span><span>{order.amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    {order.status === "Pending" ? (
                      <button className="w-full py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: "var(--hayyah-blue)" }}>Assign Provider</button>
                    ) : order.status === "Completed" ? (
                      <button className="w-full py-2 rounded-xl border text-sm font-medium bg-white" style={{ borderColor: "#e2e8f0" }}>Download Invoice</button>
                    ) : (
                      <div className="flex gap-3">
                        <button className="flex-1 py-2 rounded-xl border text-sm font-medium bg-white text-red-600" style={{ borderColor: "#e2e8f0" }}>Cancel Order</button>
                        <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: "var(--hayyah-blue)" }}>Contact Provider</button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <NewOrderDialog
        open={showNewTask}
        onClose={() => {
          setShowNewTask(false);
          void refreshOrdersData();
        }}
      />
    </AppLayout>
  );
}
