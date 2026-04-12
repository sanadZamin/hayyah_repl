import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { usePricingRules, usePricingRuleMutations, type PricingRule } from "@/hooks/use-pricing-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const SERVICE_TYPES = [
  "CLEANING",
  "LAUNDRY",
  "PAINTING",
  "MOVING",
  "CHEF",
  "SPA",
  "PEST_CONTROL",
  "REPAIRING",
  "HANDYMAN",
  "PLUMBER",
  "ELECTRICIAN",
  "HVAC",
  "CARPENTER",
  "LOCKSMITH",
] as const;

const LAUNDRY_SUBTYPES = [
  "WASH_AND_IRON",
  "IRON",
  "WASH_AND_FOLD",
  "HOME_LINEN",
  "DRY_CLEANING",
] as const;

function ruleIsActive(r: PricingRule): boolean {
  if (r.active === false || r.is_active === false) return false;
  return true;
}

function emptyForm(): FormState {
  return {
    serviceType: "CLEANING",
    subType: "",
    basePrice: "0",
    perUnitPrice: "",
    unitField: "",
    currency: "AED",
    active: true,
    extrasJson: "{}",
  };
}

type FormState = {
  serviceType: string;
  subType: string;
  basePrice: string;
  perUnitPrice: string;
  unitField: string;
  currency: string;
  active: boolean;
  extrasJson: string;
};

function ruleToForm(r: PricingRule): FormState {
  return {
    serviceType: r.serviceType ?? "",
    subType: r.subType ?? "",
    basePrice: String(r.basePrice ?? 0),
    perUnitPrice: r.perUnitPrice != null ? String(r.perUnitPrice) : "",
    unitField: r.unitField ?? "",
    currency: r.currency ?? "AED",
    active: ruleIsActive(r),
    extrasJson: JSON.stringify(r.extras ?? {}, null, 2),
  };
}

function buildDto(form: FormState): Record<string, unknown> {
  let extras: Record<string, number> | undefined;
  const raw = form.extrasJson.trim();
  if (raw && raw !== "{}") {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) throw new Error("Extras must be a JSON object.");
    extras = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isNaN(n)) throw new Error(`extras.${k} must be a number`);
      extras[k] = n;
    }
  }
  const basePrice = Number(form.basePrice);
  if (Number.isNaN(basePrice) || basePrice < 0) throw new Error("basePrice must be a number ≥ 0");
  const dto: Record<string, unknown> = {
    serviceType: form.serviceType.trim(),
    subType: form.subType.trim() ? form.subType.trim().toUpperCase() : null,
    basePrice,
    currency: form.currency.trim() || "AED",
    active: form.active,
  };
  const per = form.perUnitPrice.trim();
  if (per) {
    const p = Number(per);
    if (Number.isNaN(p)) throw new Error("perUnitPrice must be a number");
    dto.perUnitPrice = p;
  } else {
    dto.perUnitPrice = null;
  }
  const uf = form.unitField.trim();
  dto.unitField = uf || null;
  if (extras && Object.keys(extras).length > 0) dto.extras = extras;
  return dto;
}

export default function PricingRulesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: rules, isLoading, isError, error, refetch } = usePricingRules(isAdmin);
  const { createRule, updateRule, deactivateRule } = usePricingRuleMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const sortedRules = useMemo(() => {
    if (!rules) return [];
    return [...rules].sort((a, b) => {
      const st = (a.serviceType ?? "").localeCompare(b.serviceType ?? "");
      if (st !== 0) return st;
      return String(a.subType ?? "").localeCompare(String(b.subType ?? ""));
    });
  }, [rules]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (r: PricingRule) => {
    if (!r.id) return;
    setEditingId(r.id);
    setForm(ruleToForm(r));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const dto = buildDto(form);
      if (editingId) {
        await updateRule.mutateAsync({ id: editingId, body: dto as Partial<PricingRule> });
        toast({ title: "Rule updated" });
      } else {
        await createRule.mutateAsync(dto as Omit<PricingRule, "id">);
        toast({ title: "Rule created" });
      }
      setDialogOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: editingId ? "Update failed" : "Create failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const handleDeactivate = (id: string) => {
    if (!window.confirm("Deactivate this pricing rule? It will no longer apply.")) return;
    deactivateRule.mutate(id, {
      onSuccess: () => toast({ title: "Rule deactivated" }),
      onError: (e) =>
        toast({
          variant: "destructive",
          title: "Deactivate failed",
          description: e instanceof Error ? e.message : "Unknown error",
        }),
    });
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
    await refetch();
  };

  if (!isAdmin) {
    return (
      <AppLayout activeNav="dashboard">
        <div className="max-w-lg mx-auto mt-12 rounded-2xl bg-white shadow-sm border border-gray-100 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900">Admin only</h1>
          <p className="text-sm text-gray-500 mt-2">
            Pricing rules require an account with admin privileges (ROLE_admin).
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="pricing-rules">
      <div className="space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>
              Pricing rules
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Active rules from the API. Create, update, or soft-deactivate rules.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate} className="gap-2" style={{ background: "var(--hayyah-blue)" }}>
              <Plus className="w-4 h-4" />
              New rule
            </Button>
          </div>
        </div>

        {isError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Could not load rules</p>
              <p className="text-red-600 mt-0.5">{error?.message}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--hayyah-blue)" }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Service</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Subtype</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">Base</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">Per unit</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Unit field</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Currency</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Active</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No active rules returned.
                      </td>
                    </tr>
                  ) : (
                    sortedRules.map((r) => (
                      <tr key={r.id ?? `${r.serviceType}-${r.subType}`} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.serviceType}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.subType ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.basePrice}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                          {r.perUnitPrice ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.unitField ?? "—"}</td>
                        <td className="px-4 py-3">{r.currency ?? "—"}</td>
                        <td className="px-4 py-3">{ruleIsActive(r) ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={!r.id}
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              disabled={!r.id || deactivateRule.isPending}
                              onClick={() => r.id && handleDeactivate(r.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 max-w-3xl">
          <strong>REPAIRING</strong> is a pricing-only fallback for repair trades. Prefer one active generic{" "}
          <code className="bg-gray-100 px-1 rounded">REPAIRING</code> rule with empty subtype unless you override per
          trade. Laundry subtypes include WASH_AND_IRON, IRON, WASH_AND_FOLD, HOME_LINEN, DRY_CLEANING.
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit pricing rule" : "Create pricing rule"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Service type</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.serviceType}
                  onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Subtype (optional, stored uppercase)</Label>
                {form.serviceType === "LAUNDRY" ? (
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.subType}
                    onChange={(e) => setForm((f) => ({ ...f, subType: e.target.value }))}
                  >
                    <option value="">Generic (all laundry)</option>
                    {LAUNDRY_SUBTYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="e.g. WASH_AND_IRON or leave empty for generic"
                    value={form.subType}
                    onChange={(e) => setForm((f) => ({ ...f, subType: e.target.value }))}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Base price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Per-unit price (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. per room"
                    value={form.perUnitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, perUnitPrice: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit field (optional)</Label>
                  <Input
                    placeholder="e.g. rooms, numberOfGuests"
                    value={form.unitField}
                    onChange={(e) => setForm((f) => ({ ...f, unitField: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Extras (JSON object: key → number)</Label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={form.extrasJson}
                  onChange={(e) => setForm((f) => ({ ...f, extrasJson: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createRule.isPending || updateRule.isPending}
                style={{ background: "var(--hayyah-blue)" }}
              >
                {(createRule.isPending || updateRule.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                )}
                {editingId ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
