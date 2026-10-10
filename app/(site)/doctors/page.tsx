import type { Metadata } from "next"
import { ClinicUnavailable } from "@/components/clinic-unavailable"
import { CtaSection } from "@/components/cta-section"
import { DoctorDirectory } from "@/components/doctors/doctor-directory"
import { PageHero } from "@/components/page-hero"
import { clinicWeekday } from "@/lib/clinic/format"
import { getDoctorRatings, getDoctors } from "@/lib/clinic/queries"
import { getDictionary } from "@/lib/i18n/server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.doctorsPage.metaTitle, description: t.doctorsPage.metaDescription }
}

export default async function DoctorsPage() {
  const [doctors, ratings, t] = await Promise.all([getDoctors(), getDoctorRatings(), getDictionary()])
  const p = t.doctorsPage

  return (
    <>
      <PageHero
        eyebrow={p.eyebrow}
        title={p.title}
        description={<p>{p.intro}</p>}
      />

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {doctors.length > 0 ? (
            <DoctorDirectory doctors={doctors} today={clinicWeekday()} ratings={ratings} />
          ) : (
            <ClinicUnavailable title={p.comingSoon} />
          )}
        </div>
      </section>

      <CtaSection title={p.ctaTitle} description={p.ctaDescription} />
    </>
  )
}
