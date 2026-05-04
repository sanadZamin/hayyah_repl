import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wrench,
  Clock3,
  CircleDollarSign,
  LineChart,
  Bell,
  Search,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const baseNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: LineChart, label: "Revenue", id: "revenue", href: "/revenue" },
  { icon: Users, label: "Customers", id: "customers", href: "/customers" },
  { icon: ShoppingBag, label: "Tasks", id: "orders", href: "/orders" },
  { icon: Clock3, label: "Task History", id: "task-history", href: "/task-history" },
  { icon: Wrench, label: "Providers", id: "providers", href: "/providers" },
];

const adminNavItem = {
  icon: CircleDollarSign,
  label: "Pricing rules",
  id: "pricing-rules",
  href: "/pricing-rules",
} as const;

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

export function AppLayout({ children, activeNav = "dashboard" }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navItems = useMemo(
    () => (isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems),
    [isAdmin],
  );

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const nameParts = (user?.name ?? user?.username ?? "").trim().split(" ");
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] ?? "A").toUpperCase();
  const displayName = user?.name
    ? (nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` : nameParts[0])
    : user?.username ?? "Admin";

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f0f4f8" }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 flex-shrink-0"
        style={{ width: sidebarOpen ? 240 : 72, background: "var(--hayyah-navy)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-4 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)", minHeight: 64 }}
        >
          {sidebarOpen ? (
            <img
              src={`${import.meta.env.BASE_URL}images/hayyah-wordmark-white.png`}
              alt="hayyah"
              style={{ height: 32, width: "auto", flexShrink: 0 }}
            />
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}images/hayyah-icon-white.png`}
              alt="hayyah"
              style={{ height: 36, width: 36, flexShrink: 0, objectFit: "contain" }}
            />
          )}
          <button
            className="ml-auto text-white opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNav;
            return (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                style={{
                  background: isActive ? "var(--hayyah-blue)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                }}
                onClick={() => setLocation(item.href)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && sidebarOpen && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--hayyah-mint)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onClick={handleLogout}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 text-white font-semibold text-sm"
              style={{ width: 36, height: 36, background: "var(--hayyah-blue)" }}
            >
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col text-left min-w-0">
                <span className="text-white text-sm font-medium truncate">{displayName}</span>
                <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>Admin</span>
              </div>
            )}
            {sidebarOpen && <LogOut className="w-4 h-4 ml-auto flex-shrink-0" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0"
          style={{ background: "#fff", borderColor: "#e5eaf0" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 flex-1 max-w-sm"
            style={{ background: "#f0f4f8" }}
          >
            <Search className="w-4 h-4" style={{ color: "#94a3b8" }} />
            <input
              className="bg-transparent text-sm outline-none w-full"
              placeholder="Search anything..."
              style={{ color: "#1e293b" }}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "#f0f4f8" }}
            >
              <Bell className="w-4 h-4" style={{ color: "#64748b" }} />
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: "var(--hayyah-mint)" }}
              />
            </button>

            <button
              type="button"
              title="View landing page"
              onClick={() => setLocation("/welcome")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "var(--hayyah-blue-light)" }}
            >
              <Home className="w-3.5 h-3.5" style={{ color: "var(--hayyah-blue)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--hayyah-blue)" }}>
                Landing page
              </span>
            </button>

            <button className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-white font-semibold text-sm"
                style={{ width: 36, height: 36, background: "var(--hayyah-navy)" }}
              >
                {initials}
              </div>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
