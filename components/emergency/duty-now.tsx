import Link from "next/link"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { dutyMeta, dutyTypes } from "@/lib/clinic/duty"
import { formatDateTime } from "@/lib/clinic/format"
import type { OnCallWithDoctor } from "@/lib/clinic/queries"
import type { DutyType } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

/** Doctors on duty right now, with a live count per duty type. */
export function DutyNow({ shifts }: { shifts: OnCallWithDoctor[] }) {
  const now = Date.now()
  const active = shifts.filter((shift) => new Date(shift.starts_at).getTime() <= now && now < new Date(shift.ends_at).getTime())
  const count = (type: DutyType) => active.filter((shift) => (shift.duty_type ?? "on_call") === type).length

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On duty right now</p>
          <p className="mt-1 font-display text-4xl font-extrabold text-foreground">
            {active.length} <span className="text-lg font-semibold text-muted-foreground">doctors</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(dutyTypes) as DutyType[]).map((type) => {
            const meta = dutyTypes[type]
            return (
              <span key={type} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", meta.className)}>
                <meta.icon className="size-3.5" />
                {count(type)} {meta.label.toLowerCase()}
              </span>
            )
          })}
        </div>
      </div>
      {active.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {active.map((shift) => {
            const meta = dutyMeta(shift.duty_type)
            return (
              <li key={shift.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <DoctorAvatar name={shift.doctor.full_name} photoUrl={null} className="size-10 rounded-xl text-xs" />
                <span className="min-w-0 flex-1">
                  <Link href={`/doctors/${shift.doctor.slug}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary">
                    {shift.doctor.full_name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {shift.doctor.kind === "intern" ? "Intern" : shift.doctor.specialty} · until{" "}
                    {formatDateTime(shift.ends_at, { weekday: undefined, month: undefined, day: undefined })}
                  </span>
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold", meta.className)}>
                  <meta.icon className="size-3" />
                  {meta.label}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">The duty roster is being updated. Call us any time for help.</p>
      )}
    </div>
  )
}
