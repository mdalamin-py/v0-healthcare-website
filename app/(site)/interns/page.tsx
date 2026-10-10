import Link from "next/link"
import type { Metadata } from "next"
import { Clock, GraduationCap } from "lucide-react"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { PageHero } from "@/components/page-hero"
import { dutyMeta } from "@/lib/clinic/duty"
import { CLINIC_TIME_ZONE, formatDateTime } from "@/lib/clinic/format"
import { getDoctors, getOnCallShifts, type OnCallWithDoctor } from "@/lib/clinic/queries"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Intern Doctors & Duty Roster",
  description: "Our intern doctors and their ward and emergency duty schedule for the coming week.",
}

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIME_ZONE })
const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: CLINIC_TIME_ZONE })
const time = (value: string) => formatDateTime(value, { weekday: undefined, month: undefined, day: undefined })

export default async function InternsPage() {
  const [interns, shifts] = await Promise.all([
    getDoctors("intern"),
    getOnCallShifts({ days: 7, dutyTypes: ["ward", "emergency", "on_call"] }),
  ])
  const now = Date.now()
  const sorted = [...interns].sort((a, b) =>
    a.full_name.replace(/^Dr\.?\s+/i, "").localeCompare(b.full_name.replace(/^Dr\.?\s+/i, "")),
  )
  const byDoctor = (id: string) => shifts.filter((shift) => shift.doctor_id === id)

  return (
    <>
      <PageHero
        eyebrow="Intern doctors"
        title="Intern doctors & duty roster"
        description={
          <p>
            Our intern doctors support the consultant team on the wards and in the emergency department. Here is who is on
            duty over the next seven days, listed A to Z.
          </p>
        }
      />

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {sorted.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center text-muted-foreground">
              The intern roster is being updated. Please check back soon.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {sorted.map((intern) => {
                const duties = byDoctor(intern.id)
                const current = duties.find((shift) => new Date(shift.starts_at).getTime() <= now && now < new Date(shift.ends_at).getTime())
                const days = new Map<string, OnCallWithDoctor[]>()
                for (const shift of duties) {
                  const key = dayKey.format(new Date(shift.starts_at))
                  days.set(key, [...(days.get(key) ?? []), shift])
                }
                return (
                  <article key={intern.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <header className="flex items-center gap-4 border-b border-border p-5">
                      <DoctorAvatar name={intern.full_name} photoUrl={intern.photo_url} className="size-14 rounded-2xl text-lg" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/doctors/${intern.slug}`} className="font-semibold text-foreground hover:text-primary">
                          {intern.full_name}
                        </Link>
                        <p className="flex items-center gap-1.5 text-sm text-primary">
                          <GraduationCap className="size-4" />
                          Intern · {intern.specialty}
                        </p>
                      </div>
                      {current ? (
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", dutyMeta(current.duty_type).className)}>
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-50" />
                            <span className="relative inline-flex size-2 rounded-full bg-current" />
                          </span>
                          On {dutyMeta(current.duty_type).label.toLowerCase()} now
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Off duty</span>
                      )}
                    </header>
                    {duties.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {Array.from(days).map(([key, dayShifts]) => (
                          <li key={key} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                            <span className="w-28 shrink-0 text-sm font-semibold text-foreground">
                              {dayLabel.format(new Date(dayShifts[0].starts_at))}
                            </span>
                            <span className="flex flex-wrap gap-2">
                              {dayShifts.map((shift) => {
                                const meta = dutyMeta(shift.duty_type)
                                return (
                                  <span
                                    key={shift.id}
                                    className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}
                                  >
                                    <meta.icon className="size-3.5" />
                                    {meta.label}
                                    <span className="inline-flex items-center gap-1 opacity-80">
                                      <Clock className="size-3" />
                                      {time(shift.starts_at)} – {time(shift.ends_at)}
                                    </span>
                                  </span>
                                )
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-5 py-6 text-sm text-muted-foreground">No duties scheduled this week.</p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
