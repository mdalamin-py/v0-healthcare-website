import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, BadgeDollarSign, CalendarPlus, Clock, DoorOpen, GraduationCap, Languages, Moon, Phone, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { clinicWeekday, formatDateTime, formatFee, formatTimeRange, weekdays, weekOrder } from "@/lib/clinic/format"
import { departmentSlug } from "@/lib/clinic/departments"
import { getDoctorBySlug, getDoctors, getOnCallShifts } from "@/lib/clinic/queries"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const doctors = await getDoctors()
  return doctors.map((doctor) => ({ slug: doctor.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doctor = await getDoctorBySlug((await params).slug)
  if (!doctor) return { title: "Doctor not found" }
  return {
    title: `${doctor.full_name}, ${doctor.specialty}`,
    description:
      doctor.bio ?? `${doctor.full_name} is a ${doctor.specialty} specialist at ${site.name}. View schedule and book online.`,
  }
}

export default async function DoctorPage({ params }: Props) {
  const doctor = await getDoctorBySlug((await params).slug)
  if (!doctor) notFound()

  const onCall = await getOnCallShifts({ doctorId: doctor.id, days: 14 })
  const today = clinicWeekday()
  const fee = formatFee(doctor.consultation_fee)

  const facts = [
    doctor.qualification && { icon: GraduationCap, label: "Qualification", value: doctor.qualification },
    doctor.experience_years > 0 && { icon: Users, label: "Experience", value: `${doctor.experience_years}+ years` },
    { icon: Languages, label: "Languages", value: doctor.languages.join(", ") },
    doctor.room && { icon: DoorOpen, label: "Location", value: doctor.room },
    fee && { icon: BadgeDollarSign, label: "Consultation fee", value: fee },
  ].filter(Boolean) as { icon: typeof Users; label: string; value: string }[]

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="container-page relative py-12 lg:py-16">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            All doctors
          </Link>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center">
            <DoctorAvatar
              name={doctor.full_name}
              photoUrl={doctor.photo_url}
              className="size-28 rounded-3xl text-4xl shadow-xl shadow-primary/20 md:size-36"
            />
            <div className="flex-1">
              <Link
                href={`/departments/${departmentSlug(doctor.specialty)}`}
                className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
              >
                {doctor.specialty}
              </Link>
              <h1 className="mt-3 text-4xl font-extrabold text-foreground md:text-5xl">{doctor.full_name}</h1>
              {doctor.bio && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{doctor.bio}</p>}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg" className="h-12 rounded-full px-7 shadow-lg shadow-primary/25">
                <Link href={`/appointments/book?doctor=${doctor.slug}`}>
                  <CalendarPlus className="size-5" />
                  Book appointment
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full bg-card/70 px-7">
                <a href={site.phone.href}>
                  <Phone className="size-5" />
                  {site.phone.display}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-page grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-bold text-foreground">Weekly schedule</h2>
            <p className="mt-1 text-sm text-muted-foreground">All times are Pacific Time.</p>
            <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {weekOrder.map((day) => {
                const sessions = doctor.doctor_schedules.filter((schedule) => schedule.weekday === day)
                return (
                  <li
                    key={day}
                    className={cn(
                      "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                      day === today && "bg-primary/5",
                    )}
                  >
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      {weekdays[day].long}
                      {day === today && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Today
                        </span>
                      )}
                    </span>
                    {sessions.length > 0 ? (
                      <span className="flex flex-wrap gap-2">
                        {sessions.map((session) => (
                          <span
                            key={session.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                          >
                            <Clock className="size-3.5" />
                            {formatTimeRange(session.start_time, session.end_time)}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not available</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <dl className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <fact.icon className="size-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{fact.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-foreground">
                <Moon className="size-4 text-primary" />
                Upcoming on-call shifts
              </h2>
              {onCall.length > 0 ? (
                <ul className="mt-4 space-y-3 text-sm">
                  {onCall.slice(0, 5).map((shift) => (
                    <li key={shift.id} className="rounded-xl bg-muted/60 px-3 py-2">
                      <span className="font-medium text-foreground">{formatDateTime(shift.starts_at)}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        → {formatDateTime(shift.ends_at, { weekday: undefined, month: undefined, day: undefined })}
                      </span>
                      {shift.note && <span className="block text-xs text-muted-foreground">{shift.note}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No on-call shifts in the next two weeks.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
