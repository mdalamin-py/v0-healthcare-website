import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { CalendarClock, LogIn, ShieldCheck, Ticket, UserPlus } from "lucide-react"
import { BookingWizard } from "@/components/appointments/booking-wizard"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"
import { getPatientSession } from "@/lib/auth/patient"
import { getDoctors } from "@/lib/clinic/queries"

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book a doctor's appointment online in a few steps and get your serial number instantly.",
}

const highlights = [
  { icon: CalendarClock, title: "Real-time availability", body: "See open sessions for the next 30 days." },
  { icon: Ticket, title: "Instant serial number", body: "Know your place in the queue right away." },
  { icon: ShieldCheck, title: "Private & secure", body: "Your details are only visible to our care team." },
]

type Props = { searchParams: Promise<{ doctor?: string }> }

export default async function BookAppointmentPage({ searchParams }: Props) {
  const [{ doctor }, doctors, { user, profile }] = await Promise.all([searchParams, getDoctors(), getPatientSession()])
  const here = doctor ? `/appointments/book?doctor=${encodeURIComponent(doctor)}` : "/appointments/book"

  if (user && !profile) redirect(`/account?next=${encodeURIComponent(here)}`)

  const age = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 86_400_000))
    : undefined

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Book an appointment"
        description={<p>Choose a doctor, pick a session that suits you, and get your serial number instantly.</p>}
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <li key={item.title} className="flex gap-3 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur">
              <item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-12 lg:py-16">
        <div className="container-page max-w-4xl">
          {doctors.length > 0 && !user ? (
            <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
                <UserPlus className="size-7" />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-foreground">Create an account to book</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Sign up or sign in with your email or mobile number. It takes less than a minute, and you can manage all
                your appointments in one place.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8 shadow-lg shadow-primary/25">
                <Link href={`/account/login?next=${encodeURIComponent(here)}`}>
                  <LogIn className="size-5" />
                  Sign up or sign in
                </Link>
              </Button>
            </div>
          ) : doctors.length > 0 ? (
            <BookingWizard
              patient={
                profile
                  ? {
                      name: profile.full_name,
                      phone: profile.phone,
                      email: profile.email ?? "",
                      age: age ?? "",
                      gender: profile.gender ?? "",
                      address: profile.address ?? "",
                    }
                  : undefined
              }
              doctors={doctors.map(({ id, slug, full_name, specialty, photo_url, room, visit_types, accepting_appointments }) => ({
                id,
                slug,
                full_name,
                specialty,
                photo_url,
                room,
                visit_types,
                accepting_appointments,
              }))}
              initialSlug={doctor}
            />
          ) : (
            <ClinicUnavailable title="Online booking coming soon" />
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already booked?{" "}
            <Link href="/account" className="font-medium text-primary hover:underline">
              Manage your appointments
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
