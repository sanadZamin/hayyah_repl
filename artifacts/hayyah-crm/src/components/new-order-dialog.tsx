import { useState } from "react";
import { X, ChevronDown, Calendar, MapPin, User, Wrench, FileText, Clock, CheckCircle2, Loader2 } from "lucide-react";

const SERVICES = [
  "Deep Cleaning",
  "Regular Cleaning",
  "AC Maintenance",
  "Pest Control",
  "Plumbing",
  "Electrical Work",
  "Painting",
  "Carpentry",
  "Appliance Repair",
  "Garden & Landscaping",
];

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM",
];

interface NewOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewOrderDialog({ open, onClose }: NewOrderDialogProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    service: "",
    date: "",
    time: "",
    address: "",
    city: "",
    notes: "",
    paymentMethod: "cash",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setVal = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const step1Valid = form.customerName.trim() && form.service;
  const step2Valid = form.date && form.time && form.address.trim();

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setSubmitted(false);
      setSubmitting(false);
      setForm({ customerName: "", customerPhone: "", service: "", date: "", time: "", address: "", city: "", notes: "", paymentMethod: "cash" });
    }, 300);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(13,34,112,0.45)", backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100" style={{ background: "var(--hayyah-navy, #0d2270)" }}>
          <div>
            <h2 className="text-lg font-bold text-white">Create New Order</h2>
            {!submitted && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Step {step} of 3 — {step === 1 ? "Customer & Service" : step === 2 ? "Schedule & Location" : "Review & Confirm"}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full transition-colors" style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%`, background: "var(--hayyah-mint, #53ffb0)" }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(83,255,176,0.15)" }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: "var(--hayyah-mint, #53ffb0)" }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--hayyah-navy)" }}>Order Created!</h3>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold text-gray-900">{form.service}</span> for{" "}
                <span className="font-semibold text-gray-900">{form.customerName}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">{form.date} at {form.time} · {form.address}</p>
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: "rgba(83,255,176,0.2)", color: "#065f46" }}>
                Pending Assignment
              </div>
              <button
                onClick={handleClose}
                className="mt-8 w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--hayyah-blue, #0088fb)" }}
              >
                Done
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1: Customer & Service */
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <User className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input
                      value={form.customerName}
                      onChange={set("customerName")}
                      placeholder="e.g. Ahmed Al-Farsi"
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Phone Number</label>
                    <input
                      value={form.customerPhone}
                      onChange={set("customerPhone")}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <Wrench className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Service Type
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVal("service", s)}
                      className="px-3 py-2.5 rounded-xl text-sm text-left font-medium transition-all border"
                      style={{
                        background: form.service === s ? "rgba(0,136,251,0.08)" : "#f9fafb",
                        borderColor: form.service === s ? "var(--hayyah-blue)" : "transparent",
                        color: form.service === s ? "var(--hayyah-blue)" : "#374151",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2: Schedule & Location */
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                  <Calendar className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Schedule
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={set("date")}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Preferred Time <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-5 gap-2">
                      {TIME_SLOTS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setVal("time", t)}
                          className="py-2 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background: form.time === t ? "rgba(0,136,251,0.08)" : "#f9fafb",
                            borderColor: form.time === t ? "var(--hayyah-blue)" : "transparent",
                            color: form.time === t ? "var(--hayyah-blue)" : "#6b7280",
                          }}
                        >
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
                    <input
                      value={form.address}
                      onChange={set("address")}
                      placeholder="e.g. 45 Al-Olaya St, Al-Olaya District"
                      className="w-full h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">City</label>
                    <div className="relative">
                      <select
                        value={form.city}
                        onChange={set("city")}
                        className="w-full h-10 pl-3.5 pr-9 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white appearance-none transition-colors"
                      >
                        <option value="">Select city...</option>
                        {["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", "Abha"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Review & Confirm */
            <div className="p-6 space-y-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--hayyah-navy)" }}>
                <FileText className="w-4 h-4" style={{ color: "var(--hayyah-blue)" }} /> Order Summary
              </h3>

              <div className="rounded-xl overflow-hidden border border-gray-100">
                {[
                  { label: "Customer", value: form.customerName },
                  { label: "Phone", value: form.customerPhone || "—" },
                  { label: "Service", value: form.service },
                  { label: "Date", value: form.date },
                  { label: "Time", value: form.time },
                  { label: "Location", value: [form.address, form.city].filter(Boolean).join(", ") || "—" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{row.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: "cash", label: "Cash" }, { val: "card", label: "Card" }, { val: "mada", label: "Mada" }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setVal("paymentMethod", opt.val)}
                      className="py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={{
                        background: form.paymentMethod === opt.val ? "rgba(0,136,251,0.08)" : "#f9fafb",
                        borderColor: form.paymentMethod === opt.val ? "var(--hayyah-blue)" : "transparent",
                        color: form.paymentMethod === opt.val ? "var(--hayyah-blue)" : "#6b7280",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  rows={3}
                  placeholder="Any special instructions for the provider..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl border text-sm font-semibold bg-white transition-colors hover:bg-gray-50"
                style={{ borderColor: "#e2e8f0", color: "#374151" }}
              >
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border text-sm font-semibold bg-white transition-colors hover:bg-gray-50"
                style={{ borderColor: "#e2e8f0", color: "#374151" }}
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--hayyah-blue, #0088fb)" }}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity flex items-center justify-center gap-2"
                style={{ background: "var(--hayyah-blue, #0088fb)" }}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Order"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
