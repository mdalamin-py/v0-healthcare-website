import { formatDateTime } from "@/lib/clinic/format"
import type { SurgeryStatus, TheatreStatus } from "@/lib/supabase/types"

export const theatreStatuses: Record<TheatreStatus, { label: string; className: string; dot: string }> = {
  available: { label: "Available", className: "bg-accent/15 text-accent", dot: "bg-accent" },
  in_use: { label: "Operation in progress", className: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
  cleaning: { label: "Cleaning", className: "bg-star/15 text-foreground", dot: "bg-star" },
  maintenance: { label: "Maintenance", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

export const surgeryStatuses: Record<SurgeryStatus, { label: string; family: string; className: string }> = {
  scheduled: { label: "Scheduled", family: "The operation is booked and on schedule.", className: "bg-muted text-muted-foreground" },
  pre_op: { label: "Pre-op", family: "Your patient is being prepared for surgery.", className: "bg-primary/10 text-primary" },
  in_progress: {
    label: "In surgery",
    family: "The operation is in progress.",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  recovery: { label: "In recovery", family: "Surgery is finished; your patient is in the recovery room.", className: "bg-accent/15 text-accent" },
  completed: { label: "Completed", family: "Your patient has left recovery. The care team will update you.", className: "bg-accent/15 text-accent" },
  delayed: { label: "Delayed", family: "The start time has moved. Staff will keep you informed.", className: "bg-star/15 text-foreground" },
  cancelled: { label: "Cancelled", family: "This operation was cancelled. Please contact the care team.", className: "bg-muted text-muted-foreground line-through" },
}

export const theatreStatusValues = Object.keys(theatreStatuses) as [TheatreStatus, ...TheatreStatus[]]
export const surgeryStatusValues = Object.keys(surgeryStatuses) as [SurgeryStatus, ...SurgeryStatus[]]

/** The usual next step on the board, used for the one-click admin action. */
export const nextSurgeryStatus: Partial<Record<SurgeryStatus, SurgeryStatus>> = {
  scheduled: "pre_op",
  delayed: "pre_op",
  pre_op: "in_progress",
  in_progress: "recovery",
  recovery: "completed",
}

export function expectedEnd(item: { scheduled_at: string; started_at: string | null; duration_minutes: number }) {
  const start = new Date(item.started_at ?? item.scheduled_at).getTime()
  return new Date(start + item.duration_minutes * 60_000).toISOString()
}

/** Clock time (e.g. "2:30 PM") in the clinic time zone. */
export function formatClock(value: string) {
  return formatDateTime(value, { weekday: undefined, month: undefined, day: undefined })
}
