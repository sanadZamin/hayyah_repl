import { useState, useMemo } from "react";
import { useUsers, type HayyahUser } from "@/hooks/use-users";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Loader2, AlertCircle, Mail, Phone } from "lucide-react";

function getFullName(u: HayyahUser): string {
  if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  if (u.username) return u.username;
  if (u.email) return u.email;
  return u.id?.slice(0, 8) ?? "—";
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500",
  ];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Customers() {
  const { data: users, isLoading, isError, error, refetch } = useUsers(0, 100);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = getFullName(u).toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const phone = (u.phone ?? u.phoneNumber ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your client base and leads.</p>
        </div>
        {users && (
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            {users.length} customer{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-border/30 bg-card flex items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone…"
              className="pl-9 bg-background border-border/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          {/* Loading */}
          {isLoading && (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="p-10 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-medium text-foreground">Failed to load customers</p>
              <p className="text-sm text-muted-foreground max-w-xs">{error?.message}</p>
              <button onClick={() => refetch()} className="text-sm text-primary hover:underline font-medium mt-1">
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 opacity-50" />
              </div>
              <p>No customers found.</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="font-semibold text-foreground/80 py-4 pl-6">Name</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Contact</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Username</TableHead>
                    <TableHead className="font-semibold text-foreground/80 pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => {
                    const name = getFullName(user);
                    const initials = getInitials(name);
                    const avatarColor = getAvatarColor(user.id ?? "0");
                    const phone = user.phone ?? user.phoneNumber ?? null;
                    const isEnabled = user.enabled !== false;

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/20 transition-colors border-border/30">
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{name}</div>
                              {user.address && (
                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-[180px] mt-0.5">
                                  {user.address as string}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-foreground/80">{user.email}</span>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-1.5 text-sm mt-0.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">{phone}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {user.username ?? "—"}
                        </TableCell>
                        <TableCell className="pr-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            isEnabled
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                          }`}>
                            {isEnabled ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
