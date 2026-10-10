import { Activity, MapPin } from "lucide-react"
import { expectedEnd, formatClock, theatreStatuses } from "@/lib/clinic/ot"
import type { OperationTheatre, OtBoardCase } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export function TheatreGrid({ theatres, cases }: { theatres: OperationTheatre[]; cases: OtBoardCase[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {theatres.map((theatre) => {
        const status = theatreStatuses[theatre.status]
        const current = cases.find((item) => item.theatre_code === theatre.code && item.status === "in_progress")
        const next = cases.find((item) => item.theatre_code === theatre.code && ["scheduled", "pre_op", "delayed"].includes(item.status))
        return (
          <li
            key={theatre.id}
            data-theatre={theatre.code}
            className={cn(
              "relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm",
              theatre.status === "in_use" ? "border-red-500/40" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-extrabold text-foreground">{theatre.code}</p>
                <p className="text-sm text-muted-foreground">{theatre.name}</p>
              </div>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                <span className={cn("size-1.5 rounded-full", status.dot, theatre.status === "in_use" && "animate-pulse")} />
                {status.label}
              </span>
            </div>
            {theatre.location && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {theatre.location}
              </p>
            )}
            <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm">
              {current ? (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Activity className="size-4 text-red-500" />
                    {current.case_code} · {current.procedure}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {current.surgeon_name} · started {formatClock(current.started_at ?? current.scheduled_at)} · expected to finish{" "}
                    {formatClock(expectedEnd(current))}
                  </p>
                </>
              ) : next ? (
                <p className="text-muted-foreground">
                  Next: <span className="font-medium text-foreground">{next.case_code}</span> at {formatClock(next.scheduled_at)}
                </p>
              ) : (
                <p className="text-muted-foreground">No more operations scheduled today.</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
