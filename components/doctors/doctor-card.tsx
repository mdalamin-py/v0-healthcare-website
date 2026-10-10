import Link from "next/link"
import { CalendarPlus, GraduationCap, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { VisitTypeBadge } from "@/components/visit-type-badge"
import { formatFee, weekdays, weekOrder } from "@/lib/clinic/format"
import type { DoctorWithSchedules } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export function DoctorCard({ doctor, today }: { doctor: DoctorWithSchedules; today: number }) {
  const workingDays = new Set(doctor.doctor_schedules.map((schedule) => schedule.weekday))
  const fee = formatFee(doctor.consultation_fee)

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <DoctorAvatar name={doctor.full_name} photoUrl={doctor.photo_url} className="size-16 text-xl" />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            <Link href={`/doctors/${doctor.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {doctor.full_name}
            </Link>
          </h3>
          <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
          {workingDays.has(today) && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              <span className="size-1.5 rounded-full bg-accent" />
              Available today
            </span>
          )}
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm text-muted-foreground">
        {doctor.qualification && (
          <div className="flex items-start gap-2">
            <dt className="sr-only">Qualification</dt>
            <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" />
            <dd>
              {doctor.qualification}
              {doctor.experience_years > 0 && ` · ${doctor.experience_years}+ yrs`}
            </dd>
          </div>
        )}
        <div className="flex items-start gap-2">
          <dt className="sr-only">Languages</dt>
          <Languages className="mt-0.5 size-4 shrink-0 text-primary" />
          <dd>{doctor.languages.join(", ")}</dd>
        </div>
      </dl>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Visit types">
        {doctor.visit_types.map((type) => (
          <li key={type}>
            <VisitTypeBadge type={type} />
          </li>
        ))}
      </ul>

      <div className="mb-6 mt-5" aria-label="Weekly availability">
        <ul className="flex gap-1">
          {weekOrder.map((day) => (
            <li
              key={day}
              title={weekdays[day].long}
              className={cn(
                "flex h-8 flex-1 items-center justify-center rounded-md text-xs font-medium",
                workingDays.has(day)
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground/50 line-through",
                day === today && "ring-2 ring-primary/40",
              )}
            >
              <span className="sr-only">
                {weekdays[day].long}: {workingDays.has(day) ? "available" : "not available"}
              </span>
              <span aria-hidden="true">{weekdays[day].short.slice(0, 2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-5">
        <span className="text-sm text-muted-foreground">
          {fee ? (
            <>
              <span className="font-semibold text-foreground">{fee}</span> / visit
            </>
          ) : (
            "Insurance accepted"
          )}
        </span>
        <Button asChild size="sm" className="relative z-10 rounded-full">
          <Link href={`/appointments/book?doctor=${doctor.slug}`}>
            <CalendarPlus className="size-4" />
            Book
          </Link>
        </Button>
      </div>
    </article>
  )
}
