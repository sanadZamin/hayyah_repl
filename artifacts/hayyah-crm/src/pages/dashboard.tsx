import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { Users, ShoppingBag, DollarSign, Star, Plus, UserPlus, Wrench, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";
import { useLocation } from "wouter";
import { NewOrderDialog } from "@/components/new-order-dialog";

const STATUS_COLORS: Record<string, string> = {
  Completed:   "bg-[#53ffb0]/20 text-[#0d2270]",
  "In Progress": "bg-[#0088fb]/20 text-[#0088fb]",
  Pending:     "bg-amber-100 text-amber-800",
  Cancelled:   "bg-red-100 text-red-800",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BARS = [40, 60, 45, 80, 55, 90, 100, 75, 85, 120, 95, 110];

const recentOrders = [
  { id: "#HY-2024-001", customer: "Ahmed Al-Farsi",  service: "Deep Cleaning",  provider: "Omar K.",     status: "Completed",   amount: "JOD 450", date: "Today, 10:30 AM" },
  { id: "#HY-2024-002", customer: "Sarah R.",         service: "Pest Control",   provider: "Unassigned",  status: "Pending",     amount: "JOD 250", date: "Today, 12:00 PM" },
  { id: "#HY-2024-003", customer: "Mohammed N.",      service: "AC Maintenance", provider: "Ali M.",      status: "In Progress", amount: "JOD 300", date: "Today, 09:15 AM" },
  { id: "#HY-2024-004", customer: "Fatima S.",        service: "Deep Cleaning",  provider: "Hassan T.",   status: "Cancelled",   amount: "JOD 450", date: "Yesterday" },
  { id: "#HY-2024-005", customer: "Khalid B.",        service: "Plumbing",       provider: "Ibrahim W.",  status: "Completed",   amount: "JOD 150", date: "Yesterday" },
];

const topProviders = [
  { name: "Omar K.",    service: "Deep Cleaning",  jobs: 142, rating: 4.9 },
  { name: "Ali M.",     service: "AC Maintenance", jobs: 98,  rating: 4.8 },
  { name: "Khaled S.", service: "Pest Control",   jobs: 85,  rating: 4.7 },
];

export default function Dashboard() {
  const { data } = useDashboardMetrics();
  const [, setLocation] = useLocation();
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const tasksByState = (data?.tasksByState ?? {}) as Record<string, number>;
  const totalOrders    = typeof data?.totalTaskCount === "number" ? data.totalTaskCount : null;
  const totalCustomers = typeof data?.customerCount  === "number" ? data.customerCount  : null;
  const activeOrders   = data
    ? (tasksByState.AWAITING_PAYMENT ?? 0) + (tasksByState.PAID ?? 0) + (tasksByState.FULFILLING ?? 0)
    : null;

  const fmt = (v: number | null, prefix = "") =>
    v !== null ? `${prefix}${v.toLocaleString()}` : "—";

  const stats = [
    { label: "Total Orders",        value: fmt(totalOrders),    icon: ShoppingBag, trend: "+12%", positive: true },
    { label: "Active Customers",    value: fmt(totalCustomers), icon: Users,       trend: "+8%",  positive: true },
    { label: "Active Orders",       value: fmt(activeOrders),   icon: DollarSign,  trend: "+24%", positive: true },
    { label: "Avg. Service Rating", value: "4.8",               icon: Star,        trend: "-2%",  positive: false },
  ];

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
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.positive ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend}
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
              <div className="h-64 flex items-end justify-between gap-2 pb-6 relative">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 w-12 text-right pr-4">
                  <span>150k</span><span>100k</span><span>50k</span><span>0</span>
                </div>
                <div className="absolute left-12 right-0 top-2 border-t border-dashed border-gray-200" />
                <div className="absolute left-12 right-0 top-[33%] border-t border-dashed border-gray-200" />
                <div className="absolute left-12 right-0 top-[66%] border-t border-dashed border-gray-200" />
                <div className="absolute left-12 right-0 bottom-6 border-t border-dashed border-gray-200" />
                <div className="w-full flex justify-between items-end pl-14 relative z-10 h-full">
                  {BARS.map((height, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-full">
                      <div className="w-full max-w-[28px] mx-auto rounded-t-md relative group transition-all" style={{ height: `${height}%`, background: i === 9 ? "var(--hayyah-blue)" : "var(--hayyah-blue-light)" }} />
                      <span className="text-xs text-gray-500 font-medium">{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
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
              {topProviders.map((provider, i) => (
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
                {recentOrders.map((order, i) => (
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
      </div>

      <NewOrderDialog open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </AppLayout>
  );
}
