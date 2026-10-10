import Link from "next/link"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { LogIn, UserPlus } from "lucide-react"
import { BookingWizard } from "@/components/appointments/booking-wizard"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"
import { getPatientSession } from "@/lib/auth/patient"
import { getDoctors } from "@/lib/clinic/queries"
import { clinicToday } from "@/lib/clinic/time"

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book a doctor's appointment online in a few steps and get your serial number instantly.",
}

/** Whole years between two YYYY-MM-DD dates. */
function ageOn(birth: string, today: string) {
  const [by, bm, bd] = birth.split("-").map(Number)
  const [ty, tm, td] = today.split("-").map(Number)
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0)
}

type Props = { searchParams: Promise<{ doctor?: string }> }

export default async function BookAppointmentPage({ searchParams }: Props) {
  const [{ doctor }, doctors, { user, profile }] = await Promise.all([searchParams, getDoctors(), getPatientSession()])
  const here = doctor ? `/appointments/book?doctor=${encodeURIComponent(doctor)}` : "/appointments/book"

  if (user && !profile) redirect(`/account?next=${encodeURIComponent(here)}`)

  const age = profile?.date_of_birth ? ageOn(profile.date_of_birth, clinicToday()) : undefined

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Book an appointment"
        description={<p>Choose a doctor, pick a session that suits you, and get your serial number instantly.</p>}
      />

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
