import Link from "next/link"
import type { Metadata } from "next"
import { CalendarClock, ShieldCheck, Ticket } from "lucide-react"
import { BookingWizard } from "@/components/appointments/booking-wizard"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { PageHero } from "@/components/page-hero"
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
  const [{ doctor }, doctors] = await Promise.all([searchParams, getDoctors()])

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
          {doctors.length > 0 ? (
            <BookingWizard
              doctors={doctors.map(({ id, slug, full_name, specialty, photo_url, room, visit_types }) => ({
                id,
                slug,
                full_name,
                specialty,
                photo_url,
                room,
                visit_types,
              }))}
              initialSlug={doctor}
            />
          ) : (
            <ClinicUnavailable title="Online booking coming soon" />
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already booked?{" "}
            <Link href="/appointments/status" className="font-medium text-primary hover:underline">
              Check or cancel your appointment
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
