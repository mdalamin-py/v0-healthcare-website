import Link from "next/link"
import { Clock, Users } from "lucide-react"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { formatTimeRange } from "@/lib/clinic/format"
import type { QueueSession } from "@/lib/supabase/types"

export function QueueCard({ session, action }: { session: QueueSession; action?: React.ReactNode }) {
  const served = session.total - session.waiting
  const progress = session.total > 0 ? Math.round((served / session.total) * 100) : 0
  const started = session.now_serving > 0

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <DoctorAvatar name={session.doctor_name} photoUrl={null} className="size-11 rounded-xl text-sm" />
        <div className="min-w-0 flex-1">
          <Link href={`/doctors/${session.doctor_slug}`} className="block truncate font-semibold text-foreground hover:text-primary">
            {session.doctor_name}
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-primary">{session.specialty}</span> ·
            <Clock className="size-3" />
            {formatTimeRange(session.start_time, session.end_time)}
          </p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x divide-border">
        <div className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Now serving</p>
          <p className="mt-1 bg-gradient-to-br from-primary to-accent bg-clip-text font-display text-5xl font-extrabold tabular-nums text-transparent">
            {started ? session.now_serving : "—"}
          </p>
          {!started && <p className="mt-1 text-xs text-muted-foreground">Not started</p>}
        </div>
        <div className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Waiting</p>
          <p className="mt-1 font-display text-5xl font-extrabold tabular-nums text-foreground">{session.waiting}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            {session.total} booked
          </p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${progress}% of patients seen`}>
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </article>
  )
}
