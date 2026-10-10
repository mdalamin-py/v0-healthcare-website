import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, Home, ListOrdered, Stethoscope, UserX, Video } from "lucide-react"
import { BookingToggle, LeaveManager } from "@/components/doctor/portal-controls"
import { Button } from "@/components/ui/button"
import { getDoctorSession } from "@/lib/doctor/session"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import { clinicToday } from "@/lib/clinic/time"
import { site } from "@/lib/site"
import type { DoctorAppointment, DoctorLeave } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Doctor portal",
  robots: { index: false },
}

const visitIcon = { in_clinic: Stethoscope, video: Video, home_visit: Home } as const

export default async function DoctorPortalPage() {
  const { supabase, user, doctor } = await getDoctorSession()
  if (!supabase || !user) redirect("/account/login?next=/doctor-portal")

  if (!doctor) {
    return (
      <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <UserX className="size-8" />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-foreground">No doctor profile linked</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          You are signed in as <strong className="text-foreground">{user.email ?? user.phone}</strong>. Ask the clinic admin to
          save this email as your doctor email, then sign in again.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <a href={site.phone.href}>Call the clinic</a>
        </Button>
      </section>
    )
  }

  const today = clinicToday()
  const [{ data: appointmentData }, { data: leaveData }] = await Promise.all([
    supabase.rpc("doctor_appointments", { p_from: today, p_days: 7 }),
    supabase.from("doctor_leaves").select("*").eq("doctor_id", doctor.id).gte("leave_date", today).order("leave_date"),
  ])
  const appointments = (appointmentData ?? []) as DoctorAppointment[]
  const leaves = (leaveData ?? []) as DoctorLeave[]
  const active = appointments.filter((item) => item.status !== "cancelled")
  const todays = active.filter((item) => item.appointment_date === today)
  const byDate = new Map<string, DoctorAppointment[]>()
  for (const item of active) byDate.set(item.appointment_date, [...(byDate.get(item.appointment_date) ?? []), item])

  return (
    <>
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container-page flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Doctor portal</p>
            <h1 className="mt-2 text-4xl font-extrabold text-foreground">{doctor.full_name}</h1>
            <p className="mt-1 text-muted-foreground">{doctor.specialty}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Today", value: todays.length },
              { label: "Next 7 days", value: active.length },
              { label: "Days off", value: leaves.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
                <p className="font-display text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container-page grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-foreground">Online bookings</h2>
              <BookingToggle accepting={doctor.accepting_appointments} />
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground">Days off</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Days you won&apos;t sit. They show on the public schedule and block bookings.
              </p>
              <LeaveManager leaves={leaves} today={today} />
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <ListOrdered className="size-5 text-primary" />
                  Your serial list
                </h2>
                <Link href="/queue" className="text-sm font-medium text-primary hover:underline">
                  Live queue
                </Link>
              </div>
              {active.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No bookings in the next 7 days.
                </p>
              ) : (
                <div className="space-y-6">
                  {[...byDate].map(([date, items]) => (
                    <div key={date}>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        {date === today ? "Today" : formatDate(date)} · {items.length} {items.length === 1 ? "patient" : "patients"}
                      </h3>
                      <ul className="divide-y divide-border rounded-2xl border border-border">
                        {items.map((item) => {
                          const Icon = visitIcon[item.visit_type] ?? Stethoscope
                          return (
                            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">
                                {item.serial_no}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground">
                                  {item.patient_name}
                                  {item.patient_age != null && <span className="text-muted-foreground"> · {item.patient_age}y</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeRange(item.start_time, item.end_time)} · {item.patient_phone}
                                  {item.reason && ` · ${item.reason}`}
                                </p>
                                {item.visit_type === "home_visit" && item.patient_address && (
                                  <p className="text-xs text-muted-foreground">Home visit: {item.patient_address}</p>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                  item.status === "completed" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
                                )}
                              >
                                <Icon className="size-3" />
                                {item.status}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
