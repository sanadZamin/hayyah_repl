import { useDashboardMetrics } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CalendarCheck, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-lg">
          Failed to load dashboard metrics.
        </p>
      </div>
    );
  }

  const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Customers" 
          value={data.totalCustomers} 
          icon={<Users className="h-5 w-5 text-blue-500" />}
          trend={`+${data.newLeads} new leads`}
        />
        <MetricCard 
          title="Active Bookings" 
          value={data.activeBookings} 
          icon={<CalendarCheck className="h-5 w-5 text-amber-500" />}
          trend={`${data.availableTechnicians} techs available`}
        />
        <MetricCard 
          title="Completed Today" 
          value={data.completedToday} 
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
        <MetricCard 
          title="Revenue (MTD)" 
          value={`$${data.revenue.toLocaleString()}`} 
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend={
            <span className="flex items-center text-emerald-600 font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {data.revenueGrowth}%
            </span>
          }
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm rounded-2xl overflow-hidden border-border/50">
          <CardHeader className="bg-card px-6 py-5 border-b border-border/30">
            <CardTitle className="text-lg font-display">Upcoming Bookings</CardTitle>
            <CardDescription>The next 5 appointments on the schedule.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.upcomingBookings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No upcoming bookings.</div>
            ) : (
              <div className="divide-y divide-border/30">
                {data.upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{booking.customerName}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{booking.serviceName} • {booking.address}</p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
                        {format(new Date(booking.scheduledAt), "MMM d, h:mm a")}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">${booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-2xl border-border/50">
          <CardHeader className="bg-card px-6 py-5 border-b border-border/30">
            <CardTitle className="text-lg font-display">Booking Status</CardTitle>
            <CardDescription>Distribution of all active bookings.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center min-h-[300px]">
             {data.bookingsByStatus.length === 0 ? (
               <p className="text-muted-foreground">No data available.</p>
             ) : (
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.bookingsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {data.bookingsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2">
        <div className="text-3xl font-display font-bold text-foreground">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
