import { useState } from "react";
import { useBookings, useCreateBooking, useUpdateBooking } from "@/hooks/use-bookings";
import { useCustomers } from "@/hooks/use-customers";
import { useServices } from "@/hooks/use-services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar as CalendarIcon, Loader2, MapPin, Wrench } from "lucide-react";
import { format } from "date-fns";
import { UpdateBookingStatus } from "@workspace/api-client-react";

export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: bookings, isLoading } = useBookings({ 
    status: statusFilter !== "all" ? statusFilter : undefined 
  });

  const updateMutation = useUpdateBooking();

  const handleStatusChange = (id: number, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus as UpdateBookingStatus } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled jobs and appointments.</p>
        </div>
        <AddBookingDialog />
      </div>

      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-card flex flex-col sm:flex-row gap-4 items-center justify-between">
           <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-border/50 bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
          ) : bookings?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CalendarIcon className="h-6 w-6 opacity-50" />
              </div>
              <p>No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="font-semibold text-foreground/80 py-4">Job Details</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Schedule</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Price</TableHead>
                    <TableHead className="font-semibold text-foreground/80 text-right w-[180px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/20 transition-colors border-border/30">
                      <TableCell className="py-4">
                        <div className="font-medium text-foreground">{booking.customerName}</div>
                        <div className="text-sm font-medium text-primary flex items-center mt-1">
                          <Wrench className="h-3 w-3 mr-1" />
                          {booking.serviceName}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-start">
                          <MapPin className="h-3.5 w-3.5 mr-1 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{booking.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{format(new Date(booking.scheduledAt), "MMM d, yyyy")}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(booking.scheduledAt), "h:mm a")}</div>
                        {booking.technicianName && (
                          <div className="text-xs font-medium text-muted-foreground bg-muted inline-flex px-2 py-0.5 rounded mt-1">
                            {booking.technicianName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">${booking.price}</TableCell>
                      <TableCell className="text-right">
                         <Select 
                            value={booking.status} 
                            onValueChange={(v) => handleStatusChange(booking.id, v)}
                         >
                            <SelectTrigger className={`h-8 rounded-lg text-xs font-medium border-0 focus:ring-1 focus:ring-offset-0 ${getStatusColor(booking.status)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                      </TableCell>
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

function getStatusColor(status: string) {
  switch(status) {
    case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400';
    case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
    case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'cancelled': return 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

function AddBookingDialog() {
  const [open, setOpen] = useState(false);
  
  const { data: customers } = useCustomers();
  const { data: services } = useServices();
  
  const [formData, setFormData] = useState({ 
    customerId: "", 
    serviceId: "", 
    scheduledAt: "", 
    address: "", 
    price: "",
    notes: ""
  });
  
  const createMutation = useCreateBooking();

  const handleServiceSelect = (val: string) => {
    const s = services?.find(s => s.id.toString() === val);
    setFormData({
      ...formData, 
      serviceId: val,
      price: s ? s.basePrice.toString() : ""
    });
  };

  const handleCustomerSelect = (val: string) => {
    const c = customers?.find(c => c.id.toString() === val);
    setFormData({
      ...formData, 
      customerId: val,
      address: c ? c.address : formData.address
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { 
        data: {
          customerId: parseInt(formData.customerId),
          serviceId: parseInt(formData.serviceId),
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          address: formData.address,
          price: parseFloat(formData.price),
          notes: formData.notes
        } 
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-border/50">
        <DialogHeader className="px-6 py-5 bg-muted/30 border-b border-border/30">
          <DialogTitle className="font-display text-xl">Create Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">Customer</Label>
                <Select value={formData.customerId} onValueChange={handleCustomerSelect} required>
                  <SelectTrigger className="rounded-xl border-border/50">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Service</Label>
                <Select value={formData.serviceId} onValueChange={handleServiceSelect} required>
                  <SelectTrigger className="rounded-xl border-border/50">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-foreground/80">Date & Time</Label>
                <Input 
                  type="datetime-local" 
                  required 
                  value={formData.scheduledAt} 
                  onChange={e => setFormData({...formData, scheduledAt: e.target.value})} 
                  className="rounded-xl border-border/50" 
                />
              </div>
               <div className="space-y-2">
                <Label className="text-foreground/80">Price ($)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  className="rounded-xl border-border/50" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Service Address</Label>
              <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl border-border/50" />
            </div>

             <div className="space-y-2">
              <Label className="text-foreground/80">Notes</Label>
              <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="rounded-xl border-border/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-border/50">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl font-semibold">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
