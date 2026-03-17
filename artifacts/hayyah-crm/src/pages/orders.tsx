import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTasks } from "@/hooks/use-tasks";
import { Search, Eye, Edit2, Download, Calendar, X, Wrench, MapPin, User, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_MAP: Record<string, string> = {
  NEW: "New", PENDING: "Pending", CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED": case "Completed": return "bg-[#53ffb0]/20 text-emerald-800";
    case "IN_PROGRESS": case "In Progress": return "bg-[#0088fb]/20 text-[#0088fb]";
    case "PENDING": case "Pending": case "NEW": case "New": return "bg-amber-100 text-amber-800";
    case "CANCELLED": case "Cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatDate(ms: number) {
  if (!ms || ms <= 0) return "—";
  try { return format(new Date(ms), "MMM d, h:mm a"); } catch { return "—"; }
}

const MOCK_ORDERS = [
  { id: "#HY-2024-081", customer: "Ahmed Al-Farsi",  service: "Deep Cleaning",  provider: "Omar K.",    date: "Today, 10:30 AM", status: "Completed",   amount: "SAR 450", payment: "Paid" },
  { id: "#HY-2024-082", customer: "Sarah Rahman",     service: "Pest Control",   provider: "Unassigned", date: "Today, 12:00 PM", status: "Pending",     amount: "SAR 250", payment: "Pending" },
  { id: "#HY-2024-083", customer: "Mohammed N.",      service: "AC Maintenance", provider: "Ali M.",     date: "Today, 02:15 PM", status: "In Progress", amount: "SAR 300", payment: "Paid" },
  { id: "#HY-2024-084", customer: "Fatima Saeed",     service: "Plumbing",       provider: "Hassan T.",  date: "Tomorrow, 09:00", status: "Pending",     amount: "SAR 150", payment: "Pending" },
  { id: "#HY-2024-085", customer: "Khalid Basheer",   service: "Painting",       provider: "Ibrahim W.", date: "Oct 24, 10:00 AM",status: "Completed",   amount: "SAR 850", payment: "Paid" },
  { id: "#HY-2024-086", customer: "Aisha Al-Dosari",  service: "Deep Cleaning",  provider: "Omar K.",    date: "Oct 24, 01:30 PM",status: "Cancelled",   amount: "SAR 450", payment: "Refunded" },
  { id: "#HY-2024-087", customer: "Omar Tariq",       service: "AC Maintenance", provider: "Ali M.",     date: "Oct 23, 11:00 AM",status: "Completed",   amount: "SAR 300", payment: "Paid" },
  { id: "#HY-2024-088", customer: "Leena Mansour",    service: "Pest Control",   provider: "Khaled S.",  date: "Oct 23, 03:45 PM",status: "Completed",   amount: "SAR 250", payment: "Paid" },
];

const STAT_TABS = [
  { label: "Total", value: "1,284", color: "#0d2270" },
  { label: "Pending", value: "87", color: "#d97706" },
  { label: "In Progress", value: "43", color: "#0088fb" },
  { label: "Completed", value: "1,104", color: "#059669" },
  { label: "Cancelled", value: "50", color: "#dc2626" },
];

export default function Orders() {
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const hasTasks = !isLoading && !isError && tasks && tasks.length > 0;

  const apiOrders = useMemo(() => {
    if (!tasks) return [];
    return tasks.map(t => ({
      id: t.id.slice(0, 8),
      customer: t.title,
      service: t.description ?? "Service",
      provider: "Unassigned",
      date: formatDate(t.taskDateTime),
      status: STATUS_MAP[t.orderStatus] ?? t.orderStatus,
      amount: "SAR —",
      payment: "—",
    }));
  }, [tasks]);

  const orders = hasTasks ? apiOrders : MOCK_ORDERS;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      const matchSearch = !q || o.customer.toLowerCase().includes(q) || o.service.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status.toLowerCase().replace(" ", "_") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = MOCK_ORDERS.find(o => o.id === selectedId);

  const toggleRow = (id: string) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const toggleAll = () => setSelectedRows(selectedRows.length === filtered.length ? [] : filtered.map(o => o.id));

  return (
    <AppLayout activeNav="orders">
      <div className="flex h-full gap-6 relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedId ? "lg:pr-[420px]" : ""}`}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Orders</h1>
            <p className="text-gray-500 text-sm mt-1 mb-4">Manage and track all service orders</p>
            <div className="flex flex-wrap gap-3">
              {STAT_TABS.map((s) => (
                <div key={s.label} className="rounded-xl bg-white shadow-sm flex-1 min-w-[110px] px-4 py-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{s.label}</span>
                  <div className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm flex flex-col overflow-hidden relative" style={{ minHeight: 0 }}>
            {/* Bulk bar */}
            {selectedRows.length > 0 && (
              <div className="absolute top-0 left-0 right-0 z-20 text-white p-3 flex items-center justify-between px-6" style={{ background: "var(--hayyah-navy)" }}>
                <span className="text-sm font-medium">{selectedRows.length} orders selected</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.1)" }}>Assign Provider</button>
                  <button className="px-3 py-1 rounded-lg text-sm flex items-center gap-1" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <button className="px-3 py-1 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>Cancel Selected</button>
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
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm text-gray-600 outline-none bg-white" style={{ borderColor: "#e2e8f0" }}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                  <p className="text-sm font-medium text-amber-800">Live order data unavailable — showing sample data</p>
                  <p className="text-xs text-amber-600 mt-0.5">{error?.message}</p>
                </div>
                <button onClick={() => refetch()} className="text-xs font-medium text-amber-700 hover:underline">Retry</button>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10" style={{ boxShadow: "0 1px 0 #f3f4f6" }}>
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input type="checkbox" checked={selectedRows.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
                    </th>
                    {["Order ID", "Customer", "Service & Provider", "Schedule", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="font-semibold text-gray-500 py-3 px-4 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors" style={{ background: selectedRows.includes(order.id) ? "rgba(0,136,251,0.04)" : undefined }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.includes(order.id)} onChange={() => toggleRow(order.id)} className="rounded" />
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: "var(--hayyah-navy)" }}>{order.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{order.customer}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-gray-800">{order.service}</div>
                        <div className={`text-xs mt-0.5 ${order.provider === "Unassigned" ? "text-amber-600 font-medium" : "text-gray-500"}`}>{order.provider}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{order.amount}</div>
                        {"payment" in order && (
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mt-0.5">{(order as any).payment}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>{order.status}</span>
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
          </div>
        </div>

        {/* Order Detail Drawer */}
        {selectedId && (
          <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:rounded-2xl lg:border lg:shadow-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {(() => {
              const order = selectedOrder ?? filtered.find(o => o.id === selectedId);
              if (!order) return null;
              return (
                <>
                  <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "var(--hayyah-navy)" }}>Order {order.id}</h2>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>{order.status}</span>
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
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Status</h3>
                      <div className="relative pl-3 space-y-6" style={{ borderLeft: "2px solid #f3f4f6", marginLeft: 15 }}>
                        {["Order Booked", "Provider Assigned", "In Progress", "Completed"].map((step, idx) => {
                          const statuses = ["Pending", "In Progress", "Completed"];
                          const stepOrder = idx;
                          const currentStep = order.status === "Completed" ? 3 : order.status === "In Progress" ? 2 : order.status === "Cancelled" ? -1 : 1;
                          const done = stepOrder < currentStep || (order.status === "Completed" && stepOrder === 3);
                          return (
                            <div key={step} className="relative flex gap-4" style={{ marginLeft: -22 }}>
                              <div className="w-[10px] h-[10px] rounded-full ring-4 ring-white z-10 flex-shrink-0 mt-1" style={{ background: done ? "#10b981" : order.status === "Cancelled" ? "#d1d5db" : "#d1d5db" }} />
                              <div>
                                <p className={`text-sm font-bold ${done ? "text-gray-900" : "text-gray-400"}`}>{step}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Service Details</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <Wrench className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Service Type</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{order.service}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">Al Olaya District, Riyadh</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--hayyah-blue)" }}>{order.customer}</p>
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
    </AppLayout>
  );
}
