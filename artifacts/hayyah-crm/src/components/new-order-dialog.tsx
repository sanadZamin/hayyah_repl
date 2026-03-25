import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Calendar, MapPin, Wrench, FileText, CheckCircle2, Loader2, AlertCircle, Home, BedDouble, Timer, Search, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUsers, type HayyahUser } from "@/hooks/use-users";
import { apiFetch } from "@/lib/api-fetch";

function getDisplayName(u: HayyahUser): string {
  const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return full || u.username || u.email || u.id?.slice(0, 8) || "Unknown";
}

function getPhone(u: HayyahUser): string {
  const raw = u as Record<string, unknown>;

  // Check all common top-level field name variants
  for (const key of ["phone","phoneNumber","mobile","mobileNumber","tel","contactNumber","cellPhone","mobilePhone"]) {
    const val = raw[key];
    if (val && typeof val === "string") return val;
  }

  // Keycloak stores custom user attributes as { fieldName: string | string[] }
  const attrs = raw.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const attrMap = attrs as Record<string, unknown>;
    for (const key of ["phoneNumber","phone","mobile","mobileNumber","tel","contactNumber","cellPhone","mobilePhone"]) {
      const val = attrMap[key];
      if (!val) continue;
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
      if (typeof val === "string") return val;
    }
  }

  return "";
}

// Map UI service names → API serviceType values
const SERVICE_TYPE_MAP: Record<string, string> = {
  "Deep Cleaning":       "cleaning",
  "Regular Cleaning":    "cleaning",
  "AC Maintenance":      "ac_maintenance",
  "Pest Control":        "pest_control",
  "Plumbing":            "plumbing",
  "Electrical Work":     "electrical",
  "Painting":            "painting",
  "Carpentry":           "carpentry",
  "Appliance Repair":    "appliance_repair",
  "Garden & Landscaping":"gardening",
};

const SERVICES = Object.keys(SERVICE_TYPE_MAP);

const TIME_SLOTS = [
  "08:00 AM","09:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM",
];

const CITIES = ["Amman","Zarqa","Irbid","Aqaba","Salt","Madaba","Jerash","Ajloun","Karak","Mafraq"];

// Parse "08:00 AM" to hours/minutes offset
function parseTime(slot: string): { h: number; m: number } {
  const [time, ampm] = slot.split(" ");
  const [h, m] = time.split(":").map(Number);
  return { h: ampm === "PM" && h !== 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h, m };
}

function toTaskDateTime(date: string, time: string): string {
  if (!date || !time) return String(Date.now());
  const { h, m } = parseTime(time);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return String(d.getTime());
}

function isCleaningService(service: string): boolean {
  return SERVICE_TYPE_MAP[service] === "cleaning";
}

interface NewOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewOrderDialog({ open, onClose }: NewOrderDialogProps) {
  const { getToken } = useAuth();
  const { data: allUsers } = useUsers(0, 100);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<HayyahUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter users by search query
  const filteredUsers = customerSearch.trim().length > 0 && allUsers
    ? allUsers.filter(u => {
        const q = customerSearch.toLowerCase();
        return (
          getDisplayName(u).toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (getPhone(u)).includes(q)
        );
      }).slice(0, 8)
    : [];

  const handleSelectCustomer = (user: HayyahUser) => {
    setSelectedCustomer(user);
    setCustomerSearch(getDisplayName(user));
    setForm(prev => ({ ...prev, title: getDisplayName(user), customerPhone: getPhone(user) }));
    setShowDropdown(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setForm(prev => ({ ...prev, title: "", customerPhone: "" }));
  };

  const [form, setForm] = useState({
    title: "",
    customerPhone: "",
    service: "",
    date: "",
    time: "",
    address: "",
    city: "",
    rooms: "2",
    duration: "3",
    specialRequest: "",
    neededMaterial: "no",
    description: "",
    paymentMethod: "cash",
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setVal = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const step1Valid = form.title.trim().length > 0 && form.service !== "";
  const step2Valid = form.date !== "" && form.time !== "" && form.address.trim().length > 0;

  const buildPayload = () => ({
    title: form.title,
    serviceType: SERVICE_TYPE_MAP[form.service] ?? "general",
    orderState: "NEW",
    description: form.description || form.specialRequest || "No description provided",
    taskDateTime: toTaskDateTime(form.date, form.time),
    details: {
      cleaningServiceId: "b7ce6c4b-6c48-4f7c-8bd9-3f5e8e2cd2f4",
      rooms: form.rooms,
      duration: form.duration,
      specialRequest: form.specialRequest || "none",
      neededMaterial: form.neededMaterial,
      addressId: "bdbefe65-e344-416f-a484-2040d33be393",
    },
    createdAt: String(Date.now()),
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload();
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as Record<string, string>).error_description
          || (data as Record<string, string>).message
          || `Server returned ${res.status}`;
        setSubmitError(msg);
        return;
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1); setSubmitted(false); setSubmitting(false); setSubmitError(null);
      setCustomerSearch(""); setSelectedCustomer(null); setShowDropdown(false);
      setForm({ title: "", customerPhone: "", service: "", date: "", time: "", address: "", city: "", rooms: "2", duration: "3", specialRequest: "", neededMaterial: "no", description: "", paymentMethod: "cash" });
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(13,34,112,0.5)", backdropFilter: "blur(4px)" }} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ background: "var(--hayyah-navy, #0d2270)" }}>
          <div>
            <h2 className="text-lg font-bold text-white">Create New Order</h2>
            {!submitted && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Step {step} of 3 — {step === 1 ? "Customer & Service" : step === 2 ? "Schedule & Details" : "Review & Confirm"}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full" style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="h-1 bg-gray-100">
            <div className="h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%`, background: "var(--hayyah-mint, #53ffb0)" }} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SUCCESS ── */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(83,255,176,0.15)" }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--hayyah-navy)" }}>Order Created!</h3>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold text-gray-900">{form.service}</span> for{" "}
                <span className="font-semibold text-gray-900">{form.title}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">{form.date} at {form.time} · {form.city || form.address}</p>
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: "rgba(83,255,176,0.2)", color: "#065f46" }}>
                Pending Assignment
              </div>
              <button onClick={handleClose} className="mt-8 w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--hayyah-blue, #0088fb)" }}>
                Done
              </button>
            </div>

          /* ── STEP 1: Customer & Service ── */
          ) : step === 1 ? (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <Home className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Customer Details
                </h3>
                <div className="space-y-3">
                  {/* Customer search autocomplete */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div ref={searchRef} className="relative">
                      {selectedCustomer ? (
                        /* Selected state */
                        <div className="flex items-center gap-3 h-10 px-3.5 bg-[rgba(0,136,251,0.06)] border border-[var(--hayyah-blue)] rounded-xl">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: "var(--hayyah-navy)" }}>
                            {getDisplayName(selectedCustomer).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="flex-1 text-sm font-medium" style={{ color: "var(--hayyah-navy)" }}>
                            {getDisplayName(selectedCustomer)}
                          </span>
                          <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Search input */
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            value={customerSearch}
                            onChange={e => { setCustomerSearch(e.target.value); setShowDropdown(true); setForm(prev => ({ ...prev, title: e.target.value })); }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search by name, email or phone..."
                            className="w-full h-10 pl-9 pr-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
                          />
                          {!allUsers && (
                            <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                          )}
                        </div>
                      )}

                      {/* Dropdown */}
                      {showDropdown && !selectedCustomer && filteredUsers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50" style={{ maxHeight: 240 }}>
                          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                            {filteredUsers.map(user => (
                              <button
                                key={user.id}
                                type="button"
                                onMouseDown={e => { e.preventDefault(); handleSelectCustomer(user); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                              >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ background: "var(--hayyah-navy)" }}>
                                  {getDisplayName(user).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(user)}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email ?? getPhone(user) ?? user.username ?? ""}</p>
                                </div>
                                {getPhone(user) && (
                                  <span className="text-xs text-gray-400 flex-shrink-0">{getPhone(user)}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results hint */}
                      {showDropdown && !selectedCustomer && customerSearch.trim().length > 1 && filteredUsers.length === 0 && allUsers && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 z-50">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <User className="w-4 h-4 text-gray-400" />
                            No customer found — you can still proceed with this name.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile — auto-filled from selection, editable */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1.5">
                      Mobile Number
                      {selectedCustomer && form.customerPhone && (
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,136,251,0.1)", color: "var(--hayyah-blue)" }}>
                          auto-filled
                        </span>
                      )}
                    </label>
                    <input value={form.customerPhone} onChange={set("customerPhone")} placeholder="+966 5X XXX XXXX"
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <Wrench className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Service Type <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <button key={s} type="button" onClick={() => setVal("service", s)}
                      className="px-3 py-2.5 rounded-xl text-sm text-left font-medium transition-all border"
                      style={{
                        background: form.service === s ? "rgba(0,136,251,0.08)" : "#f9fafb",
                        borderColor: form.service === s ? "var(--hayyah-blue)" : "transparent",
                        color: form.service === s ? "var(--hayyah-blue)" : "#374151",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          /* ── STEP 2: Schedule & Details ── */
          ) : step === 2 ? (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <Calendar className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Schedule
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={set("date")} min={new Date().toISOString().split("T")[0]}
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Time Slot <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-5 gap-2">
                      {TIME_SLOTS.map(t => (
                        <button key={t} type="button" onClick={() => setVal("time", t)}
                          className="py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background: form.time === t ? "rgba(0,136,251,0.08)" : "#f9fafb",
                            borderColor: form.time === t ? "var(--hayyah-blue)" : "transparent",
                            color: form.time === t ? "var(--hayyah-blue)" : "#6b7280",
                          }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <MapPin className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Street Address <span className="text-red-500">*</span></label>
                    <input value={form.address} onChange={set("address")} placeholder="e.g. 45 Al-Olaya St, Al-Olaya District"
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors" />
                  </div>
                  <div className="relative">
                    <select value={form.city} onChange={set("city")}
                      className="w-full h-10 pl-3.5 pr-9 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white appearance-none transition-colors">
                      <option value="">Select city...</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {isCleaningService(form.service) && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                      <BedDouble className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Cleaning Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> Rooms</span>
                        </label>
                        <div className="flex gap-2">
                          {["1","2","3","4","5","6+"].map(r => (
                            <button key={r} type="button" onClick={() => setVal("rooms", r === "6+" ? "6" : r)}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                              style={{
                                background: form.rooms === (r === "6+" ? "6" : r) ? "rgba(0,136,251,0.08)" : "#f9fafb",
                                borderColor: form.rooms === (r === "6+" ? "6" : r) ? "var(--hayyah-blue)" : "transparent",
                                color: form.rooms === (r === "6+" ? "6" : r) ? "var(--hayyah-blue)" : "#6b7280",
                              }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Duration (hrs)</span>
                        </label>
                        <div className="flex gap-2">
                          {["2","3","4","5","6","8"].map(d => (
                            <button key={d} type="button" onClick={() => setVal("duration", d)}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
                              style={{
                                background: form.duration === d ? "rgba(0,136,251,0.08)" : "#f9fafb",
                                borderColor: form.duration === d ? "var(--hayyah-blue)" : "transparent",
                                color: form.duration === d ? "var(--hayyah-blue)" : "#6b7280",
                              }}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-transparent">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Cleaning materials included?</p>
                        <p className="text-xs text-gray-500 mt-0.5">Provider brings all supplies</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVal("neededMaterial", form.neededMaterial === "yes" ? "no" : "yes")}
                        className="w-12 h-6 rounded-full transition-all flex items-center px-0.5 flex-shrink-0"
                        style={{ background: form.neededMaterial === "yes" ? "var(--hayyah-blue)" : "#d1d5db" }}>
                        <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                          style={{ transform: form.neededMaterial === "yes" ? "translateX(24px)" : "translateX(0)" }} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          /* ── STEP 3: Review & Confirm ── */
          ) : (
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                <FileText className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Order Summary
              </h3>

              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Failed to create order</p>
                    <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl overflow-hidden border border-gray-100">
                {[
                  { label: "Customer",    value: form.title },
                  { label: "Service",     value: form.service },
                  { label: "API Type",    value: SERVICE_TYPE_MAP[form.service] ?? "—" },
                  { label: "Date",        value: form.date },
                  { label: "Time",        value: form.time },
                  { label: "Location",    value: [form.address, form.city].filter(Boolean).join(", ") || "—" },
                  ...(isCleaningService(form.service) ? [
                    { label: "Rooms",     value: `${form.rooms} room${form.rooms === "1" ? "" : "s"}` },
                    { label: "Duration",  value: `${form.duration} hours` },
                    { label: "Materials", value: form.neededMaterial === "yes" ? "Included" : "Not needed" },
                  ] : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{row.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Special Request</label>
                <input value={form.specialRequest} onChange={set("specialRequest")} placeholder="e.g. Focus on kitchen and bathrooms"
                  className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Additional Notes</label>
                <textarea value={form.description} onChange={set("description")} rows={2}
                  placeholder="Any other instructions..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: "cash", label: "Cash" }, { val: "card", label: "Card" }, { val: "mada", label: "Mada" }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setVal("paymentMethod", opt.val)}
                      className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={{
                        background: form.paymentMethod === opt.val ? "rgba(0,136,251,0.08)" : "#f9fafb",
                        borderColor: form.paymentMethod === opt.val ? "var(--hayyah-blue)" : "transparent",
                        color: form.paymentMethod === opt.val ? "var(--hayyah-blue)" : "#6b7280",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <button
              onClick={step > 1 ? () => setStep(s => s - 1) : handleClose}
              className="px-5 py-2.5 rounded-xl border text-sm font-semibold bg-white hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#e2e8f0", color: "#374151" }}>
              {step > 1 ? "Back" : "Cancel"}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--hayyah-blue, #0088fb)" }}>
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
                style={{ background: "var(--hayyah-blue, #0088fb)" }}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Order...</> : "Create Order"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
