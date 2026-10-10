import type { Metadata } from "next"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { CtaSection } from "@/components/cta-section"
import { DoctorDirectory } from "@/components/doctors/doctor-directory"
import { PageHero } from "@/components/page-hero"
import { clinicWeekday } from "@/lib/clinic/format"
import { getDoctors } from "@/lib/clinic/queries"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Our Doctors",
  description:
    "Meet our doctors and specialists in Fresno, CA. See specialties, weekly schedules and book an appointment online.",
}

export default async function DoctorsPage() {
  const doctors = await getDoctors()

  return (
    <>
      <PageHero
        eyebrow="Our Doctors"
        title="Find the right doctor for you"
        description={
          <p>
            Experienced physicians and specialists who coordinate closely with your home care team. Search by name or
            specialty and see who is available today.
          </p>
        }
      />

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {doctors.length > 0 ? (
            <DoctorDirectory doctors={doctors} today={clinicWeekday()} />
          ) : (
            <ClinicUnavailable title="Doctor directory coming soon" />
          )}
        </div>
      </section>

      <CtaSection
        title="Not sure which doctor to see?"
        description="Call us and a care coordinator will match you with the right physician or specialist for your needs."
      />
    </>
  )
}
