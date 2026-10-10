import Link from "next/link"
import type { Metadata } from "next"
import { StatusLookup } from "@/components/appointments/status-lookup"
import { PageHero } from "@/components/page-hero"

export const metadata: Metadata = {
  title: "Check Appointment Status | Dignity Home Health Care",
  description: "Check your appointment status and serial number, or cancel a booking online.",
  robots: { index: false },
}

export default function AppointmentStatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Check your appointment"
        description={<p>Enter your booking reference and phone number to see your serial number and status.</p>}
      />
      <section className="py-12 lg:py-16">
        <div className="container-page max-w-3xl">
          <StatusLookup />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need a new appointment?{" "}
            <Link href="/appointments/book" className="font-medium text-primary hover:underline">
              Book online
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
