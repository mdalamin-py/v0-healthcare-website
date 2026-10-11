import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { BadgeCheck, CalendarDays, Clock, Home, ListOrdered, Stethoscope, UserX, Video, XCircle } from "lucide-react"
import { BookingToggle, LeaveManager } from "@/components/doctor/portal-controls"
import { RegistrationForm } from "@/components/doctor/registration-form"
import { Button } from "@/components/ui/button"
import { getDoctorSession } from "@/lib/doctor/session"
import { formatDate, formatTime, formatTimeRange } from "@/lib/clinic/format"
import { clinicToday } from "@/lib/clinic/time"
import { site } from "@/lib/site"
import type { DoctorApplication, DoctorAppointment, DoctorLeave } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Doctor portal",
  robots: { index: false },
}

const visitIcon = { in_clinic: Stethoscope, video: Video, home_visit: Home } as const

/** Shown to signed-in users who are not linked to a doctor profile yet. */
function Registration({ application, email }: { application: DoctorApplication | null; email: string | null }) {
  const pending = application?.status === "pending"
  const rejected = application?.status === "rejected"

  return (
    <section className="py-12 lg:py-16">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">For doctors</p>
          <h1 className="mt-2 text-4xl font-extrabold text-foreground">Join our medical team</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Register once. After the clinic verifies your license, your profile goes live and patients can book you online.
          </p>
          <ol className="mt-8 space-y-4">
            {["Submit your details and license number", "The clinic verifies and approves you", "Manage bookings and days off from this portal"].map(
              (step, index) => (
                <li key={step} className="flex items-center gap-3 text-foreground">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
          {!email ? (
            <div className="flex flex-col items-center py-8 text-center">
              <UserX className="size-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Sign in with email to register</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Doctor accounts use your email address. Sign out, then sign in again with your email.
              </p>
            </div>
          ) : pending ? (
            <div role="status" className="flex flex-col items-center py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-star/15 text-foreground">
                <Clock className="size-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-foreground">Registration under review</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Thanks, {application.full_name}. The clinic is verifying license {application.license_number}. This page
                becomes your portal as soon as you are approved.
              </p>
            </div>
          ) : (
            <>
              {rejected && (
                <p role="alert" className="mb-6 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                  Your previous registration was not approved{application.review_note ? `: ${application.review_note}` : "."} You can update your details and apply again.
                </p>
              )}
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <BadgeCheck className="size-5 text-primary" />
                Doctor registration
              </h2>
              <p className="mb-6 mt-1 text-sm text-muted-foreground">Signed in as {email}</p>
              <RegistrationForm
                defaults={
                  rejected && application
                    ? {
                        full_name: application.full_name,
                        phone: application.phone,
                        specialty: application.specialty,
                        qualification: application.qualification,
                        license_number: application.license_number,
                        experience_years: application.experience_years,
                        languages: application.languages.join(", "),
                        bio: application.bio ?? "",
                      }
                    : {}
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default async function DoctorPortalPage() {
  const { supabase, user, doctor } = await getDoctorSession()
  if (!supabase || !user) redirect("/account/login?next=/doctor-portal")

  if (!doctor) {
    const { data: applications } = await supabase
      .from("doctor_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
    return <Registration application={(applications?.[0] as DoctorApplication | undefined) ?? null} email={user.email ?? null} />
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
                                  {item.reporting_time ? (
                                    <span className="font-medium text-foreground">{formatTime(item.reporting_time)}</span>
                                  ) : (
                                    formatTimeRange(item.start_time, item.end_time)
                                  )}{" "}
                                  · {item.patient_phone}
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
