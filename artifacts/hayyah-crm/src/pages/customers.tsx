import { useState } from "react";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Loader2 } from "lucide-react";
import { CreateCustomerStatus } from "@workspace/api-client-react";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  
  const { data: customers, isLoading } = useCustomers({ 
    search: search || undefined, 
    status: status !== "all" ? status : undefined 
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your client base and leads.</p>
        </div>
        <AddCustomerDialog />
      </div>

      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 bg-background border-border/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl border-border/50 bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : customers?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 opacity-50" />
              </div>
              <p>No customers found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground/80 py-4">Name</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Contact</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Status</TableHead>
                    <TableHead className="font-semibold text-foreground/80 text-right">Jobs</TableHead>
                    <TableHead className="font-semibold text-foreground/80 text-right">Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/20 transition-colors cursor-pointer group">
                      <TableCell className="py-4">
                        <div className="font-medium text-foreground">{customer.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{customer.address}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={customer.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">{customer.totalBookings}</TableCell>
                      <TableCell className="text-right font-semibold">${customer.totalSpent.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Just importing an icon since we used it in empty state
import { Users } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    lead: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    inactive: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20"
  };
  
  return (
    <Badge variant="outline" className={`capitalize font-medium px-2.5 py-0.5 rounded-lg ${styles[status] || styles.inactive}`}>
      {status}
    </Badge>
  );
}

function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", status: "active" as CreateCustomerStatus });
  
  const createMutation = useCreateCustomer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { data: formData },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-border/50">
        <DialogHeader className="px-6 py-5 bg-muted/30 border-b border-border/30">
          <DialogTitle className="font-display text-xl">Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80">Full Name</Label>
              <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground/80">Phone</Label>
                <Input id="phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl border-border/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground/80">Address</Label>
              <Input id="address" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl border-border/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground/80">Status</Label>
              <Select value={formData.status} onValueChange={(v: CreateCustomerStatus) => setFormData({...formData, status: v})}>
                <SelectTrigger className="rounded-xl border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-border/50">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl font-semibold">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
