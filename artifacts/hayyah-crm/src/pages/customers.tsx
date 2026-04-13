import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { useUsers, useDeleteUser, getPhone, getUsername, type HayyahUser } from "@/hooks/use-users";
import { Search, Plus, MoreVertical, Filter, ChevronLeft, ChevronRight, Phone, Mail, Clock, CheckCircle2, X, Loader2, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown, User, Trash2 } from "lucide-react";

function getFullName(u: HayyahUser): string {
  if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return getUsername(u) || u.email || u.id?.slice(0, 8) || "—";
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getStatus(u: HayyahUser): string {
  if (u.enabled === false) return "Inactive";
  return "Active";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") return <span className="px-2.5 py-1 rounded-full text-xs font-medium w-fit" style={{ background: "rgba(83,255,176,0.2)", color: "#065f46" }}>Active</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 w-fit">{status}</span>;
}

type SortCol = "name" | "email" | "username" | "status";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 ml-1 inline" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3.5 h-3.5 ml-1 inline" style={{ color: "var(--hayyah-blue)" }} />
    : <ChevronDown className="w-3.5 h-3.5 ml-1 inline" style={{ color: "var(--hayyah-blue)" }} />;
}

export default function Customers() {
  const { data: users, isLoading, isError, error, refetch } = useUsers(0, 100);
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const isDeletingUser = deleteUser.isPending;

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    const rows = users.filter((u) => {
      const name = getFullName(u).toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = getPhone(u).toLowerCase();
      const username = getUsername(u).toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q) || username.includes(q);
      const matchStatus = statusFilter === "all" || getStatus(u).toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "name")     { av = getFullName(a); bv = getFullName(b); }
      if (sortCol === "email")    { av = a.email ?? ""; bv = b.email ?? ""; }
      if (sortCol === "username") { av = getUsername(a); bv = getUsername(b); }
      if (sortCol === "status")   { av = getStatus(a); bv = getStatus(b); }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [users, search, statusFilter, sortCol, sortDir]);

  const selectedUser = filtered.find(u => u.id === selectedId);

  function handleConfirmDeleteUser() {
    if (!selectedUser?.id) return;
    deleteUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setSelectedId(null);
      },
    });
  }

  return (
    <AppLayout activeNav="customers">
      <div className="flex h-full gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedId ? "lg:pr-[380px]" : ""}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Customers</h1>
              <p className="text-gray-500 text-sm mt-1">Manage and track all registered customers</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: "var(--hayyah-blue)" }}>
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </div>

          <div className="rounded-2xl bg-white shadow-sm flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            {/* Filter bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border-0"
                  style={{ color: "#1e293b" }}
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-gray-600" style={{ borderColor: "#e2e8f0" }}>
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border text-sm text-gray-600 outline-none bg-white"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* States */}
            {isLoading && (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--hayyah-blue)" }} />
              </div>
            )}
            {isError && (
              <div className="p-10 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#fef2f2" }}>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="font-medium text-gray-900">Failed to load customers</p>
                <p className="text-sm text-gray-500 max-w-xs">{error?.message}</p>
                <button onClick={() => refetch()} className="text-sm font-medium" style={{ color: "var(--hayyah-blue)" }}>Try again</button>
              </div>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No customers found.</p>
              </div>
            )}

            {/* Table */}
            {!isLoading && !isError && filtered.length > 0 && (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10" style={{ boxShadow: "0 1px 0 #f3f4f6" }}>
                    <tr>
                      {(["name","email","mobile","username","status"] as const).map((col) => {
                        const label: Record<string, string> = { name: "Customer", email: "Email", mobile: "Mobile", username: "Username", status: "Status" };
                        const sortable = col !== "mobile";
                        return (
                          <th key={col} className={`font-semibold text-gray-500 py-4 px-4 text-left select-none ${sortable ? "cursor-pointer hover:text-gray-800" : ""}`}
                            onClick={() => sortable && handleSort(col as SortCol)}>
                            {label[col]}
                            {sortable && <SortIcon col={col as SortCol} sortCol={sortCol} sortDir={sortDir} />}
                          </th>
                        );
                      })}
                      <th className="font-semibold text-gray-500 py-4 px-4 text-left" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user) => {
                      const name = getFullName(user);
                      const initials = getInitials(name);
                      const phone = getPhone(user) || null;
                      const status = getStatus(user);
                      const isSelected = user.id === selectedId;
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-gray-50 transition-colors cursor-pointer"
                          style={{ background: isSelected ? "rgba(0,136,251,0.05)" : undefined }}
                          onClick={() => setSelectedId(isSelected ? null : (user.id ?? null))}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "var(--hayyah-navy)" }}>
                                {initials}
                              </div>
                              <span className="font-semibold" style={{ color: "var(--hayyah-navy)" }}>{name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {user.email ? (
                              <div className="flex items-center gap-1.5 text-gray-700">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs">{user.email}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {phone ? (
                              <div className="flex items-center gap-1.5 text-gray-700">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium">{phone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-500 font-mono text-xs">{getUsername(user) || "—"}</td>
                          <td className="py-4 px-4"><StatusBadge status={status} /></td>
                          <td className="py-4 px-4 text-right">
                            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                <span className="text-sm text-gray-500">Showing {filtered.length} customer{filtered.length !== 1 ? "s" : ""}</span>
                <div className="flex items-center gap-2">
                  <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-white" style={{ background: "var(--hayyah-blue)" }}>1</button>
                  <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        {selectedId && selectedUser && (
          <div className="fixed inset-y-0 right-0 w-[360px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col relative lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:rounded-2xl lg:h-auto lg:border lg:shadow-md">
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30 rounded-2xl">
                <div className="bg-white rounded-2xl shadow-xl p-6 w-[min(100%,20rem)] mx-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#fef2f2" }}>
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Delete this customer?</h3>
                      <p className="text-xs text-gray-500 mt-0.5">This removes the user from the system. This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingUser}
                      className="flex-1 py-2 rounded-xl border text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteUser}
                      disabled={isDeletingUser || !selectedUser.id}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
                      style={{ background: "#dc2626" }}
                    >
                      {isDeletingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {isDeletingUser ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-6 flex items-start justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ring-2 ring-[var(--hayyah-blue-light)]" style={{ background: "var(--hayyah-navy)" }}>
                  {getInitials(getFullName(selectedUser))}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--hayyah-navy)" }}>{getFullName(selectedUser)}</h2>
                  <div className="mt-1"><StatusBadge status={getStatus(selectedUser)} /></div>
                </div>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedId(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {selectedUser.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}
                  {getPhone(selectedUser) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="font-medium text-gray-900">{getPhone(selectedUser)}</p>
                      </div>
                    </div>
                  )}
                  {getUsername(selectedUser) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Username</p>
                        <p className="font-medium text-gray-900 font-mono">{getUsername(selectedUser)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, idx) => (
                    <div key={idx} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(83,255,176,0.2)", color: "#065f46" }}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Deep Cleaning Service</p>
                        <p className="text-xs text-gray-500 mt-0.5">Order #HY-2024-00{idx + 1} • JOD 450</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Oct {12 - idx}, 2023
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
              <div className="flex gap-3">
                <button type="button" className="flex-1 px-4 py-2 rounded-xl border text-sm font-medium bg-white" style={{ borderColor: "#e2e8f0", color: "#374151" }}>Message</button>
                <button type="button" className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: "var(--hayyah-blue)" }}>Create Order</button>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!selectedUser.id || isDeletingUser}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium text-red-600 bg-white border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete customer
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
