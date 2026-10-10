import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type BreakdownRow = { label: string; value: number; icon?: LucideIcon; barClassName?: string }

/** Labeled horizontal bars; identity is always carried by the text label. */
export function BreakdownList({ rows, emptyLabel = "No data yet" }: { rows: BreakdownRow[]; emptyLabel?: string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  if (total === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const share = Math.round((row.value / total) * 100)
        return (
          <li key={row.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                {row.icon && <row.icon className="size-4 shrink-0 text-muted-foreground" />}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{row.value}</span> · {share}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", row.barClassName ?? "bg-primary")} style={{ width: `${share}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
