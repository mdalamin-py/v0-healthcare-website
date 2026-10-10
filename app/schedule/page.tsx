import Link from "next/link"
import type { Metadata } from "next"
import { Moon, Sun } from "lucide-react"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { PageHero } from "@/components/page-hero"
import { DaySchedule } from "@/components/schedule/day-schedule"
import { OnCallNow, currentShift } from "@/components/schedule/on-call-now"
import { CLINIC_TIME_ZONE, clinicWeekday, formatDateTime } from "@/lib/clinic/format"
import { getDoctors, getOnCallShifts, type OnCallWithDoctor } from "@/lib/clinic/queries"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Doctor Schedule & On-Call | Dignity Home Health Care",
  description:
    "See which doctors are in clinic each day, their hours, and who is on call right now at Dignity Home Health Care in Fresno, CA.",
}

function groupByDay(shifts: OnCallWithDoctor[]) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: CLINIC_TIME_ZONE,
  })
  const groups = new Map<string, OnCallWithDoctor[]>()
  for (const shift of shifts) {
    const key = formatter.format(new Date(shift.starts_at))
    groups.set(key, [...(groups.get(key) ?? []), shift])
  }
  return Array.from(groups)
}

function isNightShift(startsAt: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: CLINIC_TIME_ZONE }).format(
      new Date(startsAt),
    ),
  )
  return hour >= 18 || hour < 6
}

export default async function SchedulePage() {
  const [doctors, shifts] = await Promise.all([getDoctors(), getOnCallShifts({ days: 7 })])
  const now = currentShift(shifts)

  return (
    <>
      <PageHero
        eyebrow="Schedule"
        title="Doctor schedule & on-call roster"
        description={
          <p>
            See which doctors are in clinic each day and who is on call right now. All times are Pacific Time.
          </p>
        }
      />

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {doctors.length === 0 ? (
            <ClinicUnavailable title="Schedule coming soon" />
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Weekly clinic hours</h2>
                <DaySchedule doctors={doctors} today={clinicWeekday()} />
              </div>

              <aside className="space-y-6 lg:col-span-4">
                <OnCallNow shift={now} />

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground">On-call roster · next 7 days</h2>
                  {shifts.length > 0 ? (
                    <div className="mt-5 space-y-5">
                      {groupByDay(shifts).map(([day, dayShifts]) => (
                        <div key={day}>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</h3>
                          <ul className="mt-2 space-y-2">
                            {dayShifts.map((shift) => {
                              const Icon = isNightShift(shift.starts_at) ? Moon : Sun
                              return (
                                <li
                                  key={shift.id}
                                  className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm"
                                >
                                  <Icon className="size-4 shrink-0 text-primary" />
                                  <span className="min-w-0 flex-1">
                                    <Link
                                      href={`/doctors/${shift.doctor.slug}`}
                                      className="block truncate font-medium text-foreground hover:text-primary"
                                    >
                                      {shift.doctor.full_name}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateTime(shift.starts_at, { weekday: undefined, month: undefined, day: undefined })}
                                      {" – "}
                                      {formatDateTime(shift.ends_at, { weekday: undefined, month: undefined, day: undefined })}
                                    </span>
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">The roster for the coming week is being finalized.</p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
