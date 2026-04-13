import type { Technician } from "@workspace/api-client-react";
import { useTechnicians } from "@/hooks/use-technicians";
import { OnboardTechnicianDialog } from "@/components/onboard-technician-dialog";
import { specializationLabel } from "@/components/specialization-select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Mail, Wrench } from "lucide-react";

export default function Technicians() {
  const { data: technicians, isLoading } = useTechnicians();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Technicians</h1>
          <p className="text-muted-foreground mt-1">Manage your service crew and availability.</p>
        </div>
        <OnboardTechnicianDialog
          title="Add technician"
          description="Step 1: POST /api/v1/user/create (new) or /api/v1/user/createExternal (existing Keycloak id), matching AppUserController. Step 2: POST /api/v1/technicians/admin/{userId} with admin token. Full schema: SpringDoc /v3/api-docs."
        >
          <Button className="rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add technician
          </Button>
        </OnboardTechnicianDialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
             <Card key={i} className="h-[220px] rounded-2xl bg-muted/20 animate-pulse border-border/30" />
          ))}
        </div>
      ) : technicians?.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
          <p>No technicians added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {technicians?.map((tech: Technician) => {
            const displayName = `${tech.firstName} ${tech.lastName}`.trim() || tech.email;
            const ratingLabel =
              tech.rating != null && Number.isFinite(tech.rating)
                ? tech.rating.toFixed(1)
                : "—";
            return (
            <Card key={tech.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-amber-500 opacity-80" />
              <CardHeader className="pb-3 pt-5 px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{displayName}</h3>
                    <div className="flex items-center text-sm text-primary font-medium mt-1">
                      <Wrench className="h-3 w-3 mr-1.5" />
                      {specializationLabel(tech.specialization)}
                    </div>
                  </div>
                  <TechStatusBadge verified={tech.verified} />
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3 mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-3 text-foreground/40" />
                    {tech.email}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                  <div className="flex items-center text-amber-500 font-medium">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    {ratingLabel}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TechStatusBadge({ verified }: { verified: boolean }) {
  const label = verified ? "Verified" : "Unverified";
  const styles = verified
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    : "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20";

  return (
    <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 rounded-lg ${styles}`}>
      {label}
    </Badge>
  );
}
