import { useTasks, type Task } from "@/hooks/use-tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

const STATUS_LABELS: Record<string, string> = {
  NEW:         "New",
  PENDING:     "Pending",
  CONFIRMED:   "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED:   "Completed",
  CANCELLED:   "Cancelled",
};

function getStatusColor(status: string) {
  switch (status) {
    case "NEW":         return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-400";
    case "PENDING":     return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
    case "CONFIRMED":   return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
    case "IN_PROGRESS": return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400";
    case "COMPLETED":   return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400";
    case "CANCELLED":   return "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400";
    default:            return "bg-muted text-muted-foreground";
  }
}

function formatTaskDate(ms: number) {
  if (!ms || ms <= 0) return "—";
  try {
    return format(new Date(ms), "MMM d, yyyy · h:mm a");
  } catch {
    return "—";
  }
}

export default function Bookings() {
  const { data: tasksPage, isLoading, isError, error, refetch } = useTasks(0, 200);
  const tasks = tasksPage?.content ?? [];
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === "all" || t.orderStatus === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tasks, statusFilter, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled jobs and appointments.</p>
        </div>
        {tasksPage && (
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            {tasks.length} total task{tasks.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border/30 bg-card flex flex-col sm:flex-row gap-3 items-center">
          <Input
            placeholder="Search title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs rounded-xl border-border/50 bg-background"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl border-border/50 bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <p className="font-medium text-foreground">Failed to load bookings</p>
              <p className="text-sm text-muted-foreground max-w-xs">{error?.message}</p>
              <button
                onClick={() => refetch()}
                className="text-sm text-primary hover:underline font-medium mt-1"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CalendarIcon className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-muted-foreground">No bookings found.</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/30">
                    <TableHead className="font-semibold text-foreground/80 py-4 pl-6">Task</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Scheduled</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Created</TableHead>
                    <TableHead className="font-semibold text-foreground/80 pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((task: Task) => (
                    <TableRow key={task.id} className="hover:bg-muted/20 transition-colors border-border/30">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ClipboardList className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">
                                {task.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground/60 mt-1 font-mono">
                              {task.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTaskDate(task.taskDateTime)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTaskDate(task.created_at)}
                      </TableCell>
                      <TableCell className="pr-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(task.orderStatus)}`}>
                          {STATUS_LABELS[task.orderStatus] ?? task.orderStatus}
                        </span>
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
