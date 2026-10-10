import { formatDate } from "@/lib/clinic/format"
import { cn } from "@/lib/utils"

type Point = { date: string; count: number }

/** Single-series daily bar chart with hover tooltips and an accessible data table. */
export function DailyBarChart({ data, today, label }: { data: Point[]; today: string; label: string }) {
  const max = Math.max(4, ...data.map((point) => point.count))
  const ticks = [0, Math.round(max / 2), max]

  return (
    <figure>
      <div className="relative mt-4 h-72 pl-8" role="img" aria-label={`${label}: bar chart`}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${(tick / max) * 100}%` }}
            aria-hidden="true"
          >
            <span className="w-6 -translate-y-1/2 text-right text-[11px] tabular-nums text-muted-foreground">{tick}</span>
            <span className="h-px flex-1 -translate-y-1/2 bg-border/70" />
          </div>
        ))}
        <ol className="relative flex h-full items-end gap-[2px]">
          {data.map((point) => (
            <li key={point.date} className="group relative flex h-full flex-1 items-end justify-center">
              <span
                className={cn(
                  "w-full max-w-7 rounded-t-[4px] transition-colors",
                  point.date === today ? "bg-accent" : "bg-primary/70 group-hover:bg-primary",
                )}
                style={{ height: `${Math.max((point.count / max) * 100, point.count ? 2 : 0)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <span className="block font-semibold text-foreground">
                  {point.count} {point.count === 1 ? "appointment" : "appointments"}
                </span>
                <span className="block text-muted-foreground">{formatDate(point.date, { weekday: "short" })}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-2 flex justify-between pl-8 text-[11px] text-muted-foreground" aria-hidden="true">
        <span>{formatDate(data[0].date, { weekday: undefined })}</span>
        <span>{formatDate(data[Math.floor(data.length / 2)].date, { weekday: undefined })}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Appointments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
