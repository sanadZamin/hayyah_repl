import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  CreateAppUser,
  RegisterTechnicianByAdmin,
  TechnicianSpecialization,
} from "@workspace/api-client-react";
import {
  getListTechniciansQueryKey,
  useCreateUser,
  useRegisterTechnicianByAdmin,
} from "@workspace/api-client-react";
import { SpecializationSelect } from "@/components/specialization-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { extractNewUserId } from "@/lib/extract-new-user-id";
import { normalizeEmail } from "@/lib/normalize-email";
import { normalizeMobileNumber } from "@/lib/normalize-mobile-number";
import { Loader2 } from "lucide-react";

export type OnboardTechnicianDialogProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const emptyUserForm = {
  email: "",
  firstName: "",
  lastName: "",
  userName: "",
  mobileNumber: "",
};

const emptyTechForm = {
  specialization: "" as string,
  bio: "",
};

export function OnboardTechnicianDialog({
  title,
  description: _description,
  children,
}: OnboardTechnicianDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [techForm, setTechForm] = useState(emptyTechForm);

  const resetAll = () => {
    setUserForm(emptyUserForm);
    setTechForm(emptyTechForm);
  };

  const createUserMutation = useCreateUser({
    mutation: {
      onError: (err) => {
        console.error(err);
        toast({
          title: "Could not create user",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      },
    },
  });

  const assignMutation = useRegisterTechnicianByAdmin({
    mutation: {
      onError: (err) => {
        console.error(err);
        toast({
          title: "Could not register technician",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      },
    },
  });

  const busy = createUserMutation.isPending || assignMutation.isPending;

  const buildSharedFields = () => {
    const email = normalizeEmail(userForm.email);
    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const userName = userForm.userName.trim();
    const mobileNumber = normalizeMobileNumber(userForm.mobileNumber);
    return { email, firstName, lastName, userName, mobileNumber };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const f = buildSharedFields();
    if (!f.email || !f.firstName || !f.lastName || !f.userName || !f.mobileNumber) {
      toast({
        title: "Fill in email, names, userName, and mobileNumber",
        variant: "destructive",
      });
      return;
    }
    if (!techForm.specialization) {
      toast({ title: "Select a specialization", variant: "destructive" });
      return;
    }

    const payload: CreateAppUser = {
      firstName: f.firstName,
      lastName: f.lastName,
      userName: f.userName,
      email: f.email,
      mobileNumber: f.mobileNumber,
      role: "user",
    };

    createUserMutation.mutate(
      { data: payload },
      {
        onSuccess: (created) => {
          const id = extractNewUserId(created);
          if (!id) {
            toast({
              title: "User may have been created",
              description:
                "The response had no id. Check SpringDoc AppUserDto or the user list, then continue manually if needed.",
              variant: "destructive",
            });
            return;
          }
          const data: RegisterTechnicianByAdmin = {
            specialization: techForm.specialization as TechnicianSpecialization,
          };
          const bio = techForm.bio.trim();
          if (bio) data.bio = bio;
          assignMutation.mutate(
            { userId: id, data },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListTechniciansQueryKey() });
                queryClient.invalidateQueries({ queryKey: ["users"] });
                toast({ title: "Technician onboarded" });
                setOpen(false);
                resetAll();
              },
            },
          );
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl p-0 overflow-hidden border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 py-5 bg-muted/30 border-b border-border/30">
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ob-email">Email</Label>
              <Input
                id="ob-email"
                type="email"
                autoComplete="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={busy}
                className="rounded-xl border-border/50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ob-first">First name</Label>
                <Input
                  id="ob-first"
                  autoComplete="given-name"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                  disabled={busy}
                  className="rounded-xl border-border/50"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-last">Last name</Label>
                <Input
                  id="ob-last"
                  autoComplete="family-name"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                  disabled={busy}
                  className="rounded-xl border-border/50"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ob-username">userName</Label>
              <Input
                id="ob-username"
                autoComplete="username"
                value={userForm.userName}
                onChange={(e) => setUserForm({ ...userForm, userName: e.target.value })}
                disabled={busy}
                className="rounded-xl border-border/50"
                placeholder="sara.ali"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ob-mobile">mobileNumber</Label>
              <Input
                id="ob-mobile"
                type="tel"
                autoComplete="tel"
                value={userForm.mobileNumber}
                onChange={(e) => setUserForm({ ...userForm, mobileNumber: e.target.value })}
                disabled={busy}
                className="rounded-xl border-border/50"
                placeholder="+971501234567"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ob-spec">Specialization</Label>
              <SpecializationSelect
                id="ob-spec"
                value={techForm.specialization}
                onValueChange={(specialization) => setTechForm({ ...techForm, specialization })}
                disabled={busy}
                className="border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-bio">Bio (optional)</Label>
              <Textarea
                id="ob-bio"
                rows={3}
                value={techForm.bio}
                onChange={(e) => setTechForm({ ...techForm, bio: e.target.value })}
                className="rounded-xl border-border/50 resize-none"
                placeholder="Short professional summary…"
                disabled={busy}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <Button type="button" variant="outline" className="rounded-xl border-border/50" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="rounded-xl font-semibold">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create and register technician
              </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
