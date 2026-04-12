import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { useTaskEvents, useTasks } from "@/hooks/use-tasks";
import { AlertCircle, Clock3, Loader2 } from "lucide-react";
import { format } from "date-fns";

function formatEventDate(ms: number) {
  if (!ms || ms <= 0) return "—";
  try {
    return format(new Date(ms), "MMM d, yyyy h:mm a");
  } catch {
    return "—";
  }
}

export default function TaskHistoryPage() {
  const { data: tasksPage, isLoading: isTasksLoading, isError: isTasksError, error: tasksError } = useTasks(0, 200);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const { data: events, isLoading: isEventsLoading, isError: isEventsError, error: eventsError } = useTaskEvents(selectedTaskId || null);
  const tasks = tasksPage?.content ?? [];

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(b.taskDateTime) - Number(a.taskDateTime));
  }, [tasks]);

  return (
    <AppLayout activeNav="task-history">
      <div className="space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--hayyah-navy)" }}>Task History</h1>
          <p className="text-sm text-gray-500 mt-1">Retrieve and review order events by task ID.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Select Task</label>
          {isTasksLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading tasks...
            </div>
          ) : isTasksError ? (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{tasksError?.message || "Failed to load tasks."}</span>
            </div>
          ) : (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full max-w-xl h-10 px-3.5 text-sm bg-gray-50 rounded-xl outline-none border border-transparent focus:border-[var(--hayyah-blue)] focus:bg-white transition-colors"
            >
              <option value="">Choose a task...</option>
              {sortedTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.title || t.description || "Task"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Events</h2>
          </div>

          {!selectedTaskId ? (
            <div className="p-6 text-sm text-gray-500">Select a task to view event history.</div>
          ) : isEventsLoading ? (
            <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading events...
            </div>
          ) : isEventsError ? (
            <div className="p-6 flex items-start gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{eventsError?.message || "Failed to load task events."}</span>
            </div>
          ) : !events || events.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No events found for this task.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Time</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Transition</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Actor</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500">Event ID</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events]
                    .sort((a, b) => Number(a.createdAt) - Number(b.createdAt))
                    .map((evt) => (
                      <tr key={evt.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatEventDate(evt.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 font-medium">{evt.fromState}</span>
                          <span className="text-gray-400 mx-1">to</span>
                          <span className="text-gray-900 font-medium">{evt.toState}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{evt.reasonCode || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{evt.actorType || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{evt.id}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
