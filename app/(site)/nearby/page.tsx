import type { Metadata } from "next"
import { Phone } from "lucide-react"
import { FacilityFinder } from "@/components/facilities/facility-finder"
import { PageHero } from "@/components/page-hero"
import { getNearbyFacilities } from "@/lib/clinic/queries"
import { site } from "@/lib/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Nearby Hospitals & Clinics",
  description: "Hospitals, emergency rooms, urgent care and clinics near our Fresno clinic, with distance, phone and directions.",
}

export default async function NearbyPage() {
  const facilities = await getNearbyFacilities()

  return (
    <>
      <PageHero
        eyebrow="Nearby care"
        title="Hospitals & clinics near you"
        description={
          <p>
            Emergency rooms, urgent care and clinics around {site.address.city}, sorted by distance. Use your location for
            the closest option — for a life-threatening emergency, call 911.
          </p>
        }
      >
        <a
          href="tel:911"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-lg shadow-red-600/25"
        >
          <Phone className="size-4" />
          Emergency: call 911
        </a>
      </PageHero>

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {facilities.length > 0 ? (
            <FacilityFinder facilities={facilities} clinic={{ ...site.address.geo, label: "our clinic" }} />
          ) : (
            <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center text-muted-foreground">
              The facility directory is being updated. Call {site.phone.display} and we will point you to the nearest care.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
