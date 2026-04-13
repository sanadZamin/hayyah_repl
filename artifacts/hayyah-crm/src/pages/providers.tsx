import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import type { Technician } from "@workspace/api-client-react";
import { useTechnicians } from "@/hooks/use-technicians";
import { OnboardTechnicianDialog } from "@/components/onboard-technician-dialog";
import { Button } from "@/components/ui/button";
import { specializationLabel } from "@/components/specialization-select";
import {
  Plus,
  MapPin,
  Star,
  Briefcase,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  X,
  FileCheck,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  rating: number;
  jobs: number;
  activeJobs: number;
  city: string;
  status: string;
  skills: string[];
}

const MOCK_PROVIDERS: Provider[] = [
  { id: "p1", name: "Omar Kahlil",   initials: "OK", specialty: "Deep Cleaning Specialist", rating: 4.9, jobs: 142, activeJobs: 2, city: "Riyadh",  status: "Available", skills: ["Deep Cleaning", "Carpet Cleaning", "Sanitization"] },
  { id: "p2", name: "Ali Mahmoud",   initials: "AM", specialty: "AC Maintenance",           rating: 4.8, jobs: 98,  activeJobs: 1, city: "Jeddah",  status: "Busy",      skills: ["Split AC", "Central AC", "Duct Cleaning"] },
  { id: "p3", name: "Khaled Saqr",   initials: "KS", specialty: "Pest Control",             rating: 4.7, jobs: 85,  activeJobs: 0, city: "Riyadh",  status: "Off",       skills: ["Insects", "Rodents", "Termites"] },
  { id: "p4", name: "Ibrahim W.",    initials: "IW", specialty: "Plumbing",                 rating: 4.5, jobs: 64,  activeJobs: 3, city: "Dammam",  status: "Busy",      skills: ["Leaks", "Pipe Fitting", "Water Heaters"] },
  { id: "p5", name: "Hassan Tarek",  initials: "HT", specialty: "Deep Cleaning",            rating: 4.6, jobs: 112, activeJobs: 0, city: "Riyadh",  status: "Available", skills: ["Deep Cleaning", "Post-construction"] },
  { id: "p6", name: "Youssef Ali",   initials: "YA", specialty: "Painting",                 rating: 4.9, jobs: 45,  activeJobs: 1, city: "Jeddah",  status: "Available", skills: ["Interior", "Exterior", "Wallpaper"] },
];

function statusColor(status: string) {
  switch (status) {
    case "Available": return "#53ffb0";
    case "Busy": return "#fbbf24";
    default: return "#d1d5db";
  }
}

const AVAILABILITY_FILTERS = [
  { key: "Available", label: "Verified (available)" },
  { key: "Off", label: "Unverified / off" },
  { key: "Busy", label: "Busy" },
] as const;

export default function Providers() {
  const { data: techData } = useTechnicians();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedAvailability, setSelectedAvailability] = useState<Set<string>>(
    () => new Set(),
  );

  const providers: Provider[] =
    techData && techData.length > 0
      ? techData.map((t: Technician) => {
          const name = `${t.firstName} ${t.lastName}`.trim() || t.email;
          const specialty = t.specialization;
          return {
            id: String(t.id),
            name,
            initials: name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            specialty,
            rating: t.rating != null && Number.isFinite(t.rating) ? t.rating : 0,
            jobs: 0,
            activeJobs: 0,
            city: "—",
            status: t.verified ? "Available" : "Off",
            skills: [specialty],
          };
        })
      : MOCK_PROVIDERS;

  const specializationOptions = useMemo(() => {
    const uniq = new Set<string>();
    for (const p of providers) {
      const s = p.specialty.trim();
      if (s) uniq.add(s);
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [providers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return providers.filter((p) => {
      const specLabel = specializationLabel(p.specialty).toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        specLabel.includes(q) ||
        p.skills.some((sk) => sk.toLowerCase().includes(q));

      const matchesSpec =
        selectedSpecializations.size === 0 || selectedSpecializations.has(p.specialty);

      const matchesAvail =
        selectedAvailability.size === 0 || selectedAvailability.has(p.status);

      return matchesSearch && matchesSpec && matchesAvail;
    });
  }, [providers, search, selectedSpecializations, selectedAvailability]);

  useEffect(() => {
    if (selectedId && !filtered.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selectedProvider = filtered.find((p) => p.id === selectedId);

  const resetFilters = () => {
    setSelectedSpecializations(new Set());
    setSelectedAvailability(new Set());
    setSearch("");
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecializations((prev) => {
      const next = new Set(prev);
      if (next.has(spec)) next.delete(spec);
      else next.add(spec);
      return next;
    });
  };

  const toggleAvail = (statusKey: string) => {
    setSelectedAvailability((prev) => {
      const next = new Set(prev);
      if (next.has(statusKey)) next.delete(statusKey);
      else next.add(statusKey);
      return next;
    });
  };

  const hasActiveFilters =
    selectedSpecializations.size > 0 || selectedAvailability.size > 0 || search.trim() !== "";

  const statsProviders = filtered;
  const avgRating =
    statsProviders.length === 0
      ? "0.0"
      : (
          statsProviders.reduce((s, p) => s + p.rating, 0) / statsProviders.length
        ).toFixed(1);

  return (
    <AppLayout activeNav="providers">
      <div className="flex h-full gap-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Left sidebar filters */}
        <div className="w-56 flex-shrink-0 hidden lg:flex flex-col bg-white rounded-2xl shadow-sm p-5 self-start sticky top-0">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="font-bold" style={{ color: "var(--hayyah-navy)" }}>Filters</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Specialization</h3>
              {specializationOptions.length === 0 ? (
                <p className="text-xs text-gray-500">No specializations in the current list.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {specializationOptions.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        style={{ accentColor: "var(--hayyah-blue)" }}
                        checked={selectedSpecializations.has(s)}
                        onChange={() => toggleSpec(s)}
                      />
                      <span className="break-words">{specializationLabel(s)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Status</h3>
              <div className="space-y-2.5">
                {AVAILABILITY_FILTERS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      style={{ accentColor: "var(--hayyah-blue)" }}
                      checked={selectedAvailability.has(key)}
                      onChange={() => toggleAvail(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
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

        {/* Main content */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedId ? "xl:pr-[400px]" : ""}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Service Providers</h1>
              <p className="text-gray-500 text-sm mt-1">Manage and track your service fleet</p>
            </div>
            <OnboardTechnicianDialog
              title="Add provider"
              description="Same as technicians: POST /api/v1/user/create or createExternal, then POST /api/v1/technicians/admin/{userId} (admin). See SpringDoc /v3/api-docs for AppUserDto."
            >
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                style={{ background: "var(--hayyah-blue)" }}
              >
                <Plus className="w-4 h-4" /> Add Provider
              </button>
            </OnboardTechnicianDialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Showing", value: String(statsProviders.length) },
              {
                label: "Verified",
                value: String(statsProviders.filter((p) => p.status === "Available").length),
              },
              { label: "Avg. rating", value: avgRating, isRating: true },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-white shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{s.label}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>{s.value}</p>
                    {s.isRating && <Star className="w-5 h-5 fill-amber-400 text-amber-400 mb-1" />}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--hayyah-blue-light)" }}>
                  <Briefcase className="w-5 h-5" style={{ color: "var(--hayyah-blue)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Search & view toggle */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers..." className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-sm outline-none shadow-sm" style={{ borderColor: "#e2e8f0" }} />
            </div>
            <div className="flex bg-white rounded-lg p-1 border shadow-sm" style={{ borderColor: "#e2e8f0" }}>
              <button onClick={() => setViewMode("grid")} className="p-1.5 rounded-md transition-colors" style={{ background: viewMode === "grid" ? "#f3f4f6" : "transparent", color: viewMode === "grid" ? "var(--hayyah-navy)" : "#94a3b8" }}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("table")} className="p-1.5 rounded-md transition-colors" style={{ background: viewMode === "table" ? "#f3f4f6" : "transparent", color: viewMode === "table" ? "var(--hayyah-navy)" : "#94a3b8" }}>
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid view */}
          {viewMode === "grid" && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
              {providers.length === 0
                ? "No providers yet."
                : "No providers match your search or filters. Try adjusting filters or reset."}
            </div>
          )}
          {viewMode === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-6">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{ outline: selectedId === p.id ? `2px solid var(--hayyah-blue)` : "none" }}
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                >
                  <div className="p-5 flex gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm" style={{ background: "var(--hayyah-navy)" }}>
                        {p.initials}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: statusColor(p.status) }} title={p.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate" style={{ color: "var(--hayyah-navy)" }}>{p.name}</h3>
                      <p className="text-xs font-medium mt-0.5 truncate" style={{ color: "var(--hayyah-blue)" }}>{specializationLabel(p.specialty)}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {p.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 flex justify-between border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Completed</p>
                      <p className="font-semibold text-gray-900">{p.jobs}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Active Now</p>
                      <p className="font-semibold" style={{ color: p.activeJobs > 0 ? "var(--hayyah-blue)" : "#374151" }}>{p.activeJobs}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex items-center justify-center">
                      <button className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "var(--hayyah-blue)" }}>
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table view */}
          {viewMode === "table" && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
              {providers.length === 0
                ? "No providers yet."
                : "No providers match your search or filters."}
            </div>
          )}
          {viewMode === "table" && filtered.length > 0 && (
            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Provider", "Specialty", "City", "Status", "Rating", "Jobs", ""].map(h => (
                      <th key={h} className="font-semibold text-gray-500 py-3 px-4 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--hayyah-navy)" }}>{p.initials}</div>
                          <span className="font-semibold" style={{ color: "var(--hayyah-navy)" }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{specializationLabel(p.specialty)}</td>
                      <td className="py-3 px-4 text-gray-600">{p.city}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: statusColor(p.status) + "33", color: "#1e293b" }}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Star className="w-3.5 h-3.5 fill-current" /> {p.rating}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{p.jobs}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-xs font-semibold" style={{ color: "var(--hayyah-blue)" }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && selectedProvider && (
          <div className="fixed inset-y-0 right-0 w-[380px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col xl:absolute xl:right-0 xl:top-0 xl:bottom-0 xl:rounded-2xl xl:border xl:shadow-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="h-28 rounded-t-2xl relative flex-shrink-0" style={{ background: "var(--hayyah-blue-light)" }}>
              <button className="absolute top-4 right-4 p-1.5 rounded-full bg-white/60 hover:bg-white text-gray-700" onClick={() => setSelectedId(null)}>
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-10 left-6">
                <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md" style={{ background: "var(--hayyah-navy)" }}>
                  {selectedProvider.initials}
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: statusColor(selectedProvider.status) }} />
              </div>
            </div>

            <div className="pt-14 px-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-bold" style={{ color: "var(--hayyah-navy)" }}>{selectedProvider.name}</h2>
              <p className="text-sm font-medium mt-1" style={{ color: "var(--hayyah-blue)" }}>{specializationLabel(selectedProvider.specialty)}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedProvider.skills.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs font-semibold rounded-md" style={{ background: "var(--hayyah-blue-light)", color: "var(--hayyah-blue)" }}>{specializationLabel(skill)}</span>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Verification Status</h3>
                <div className="space-y-3">
                  {[{ Icon: ShieldCheck, label: "Background Check", sub: "Verified" }, { Icon: FileCheck, label: "ID & Certifications", sub: "All documents up to date" }].map(({ Icon, label, sub }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Performance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-xl p-4 text-center">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400 mx-auto mb-1" />
                    <p className="text-xl font-bold" style={{ color: "var(--hayyah-navy)" }}>{selectedProvider.rating}</p>
                    <p className="text-xs text-gray-500">Avg. Rating</p>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--hayyah-mint)" }} />
                    <p className="text-xl font-bold" style={{ color: "var(--hayyah-navy)" }}>98%</p>
                    <p className="text-xs text-gray-500">Completion Rate</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Schedule</h3>
                  <button className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--hayyah-blue)" }}>
                    <CalendarDays className="w-3 h-3" /> Full Calendar
                  </button>
                </div>
                {selectedProvider.activeJobs > 0 ? (
                  <div className="space-y-3">
                    {[...Array(selectedProvider.activeJobs)].map((_, idx) => (
                      <div key={idx} className="flex gap-3 pl-4 py-1 border-l-2" style={{ borderColor: "var(--hayyah-blue)" }}>
                        <div>
                          <p className="text-xs font-bold" style={{ color: "var(--hayyah-blue)" }}>10:00 AM – 12:00 PM</p>
                          <p className="text-sm font-semibold text-gray-900">{specializationLabel(selectedProvider.specialty)} Service</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {selectedProvider.city} District</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-100">
                    <p className="text-sm text-gray-500">No active jobs scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 rounded-b-2xl shadow-sm">
              <button className="flex-1 py-2 rounded-xl border text-sm font-medium bg-white" style={{ borderColor: "#e2e8f0" }}>Message</button>
              <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: "var(--hayyah-blue)" }}>Assign Job</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
