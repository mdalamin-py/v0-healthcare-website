import type { Metadata } from "next"
import { Phone } from "lucide-react"
import { AmbulanceRequestForm } from "@/components/ambulance/ambulance-request-form"
import { FleetBoard } from "@/components/ambulance/fleet-board"
import { FleetSummary } from "@/components/ambulance/fleet-summary"
import { PageHero } from "@/components/page-hero"
import { AutoRefresh } from "@/components/queue/auto-refresh"
import { getAmbulances } from "@/lib/clinic/queries"
import { site } from "@/lib/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ambulance Service",
  description: "Live status of our ambulance fleet — types, equipment and availability — and online transport requests.",
}

export default async function AmbulancePage() {
  const fleet = await getAmbulances()

  return (
    <>
      <PageHero
        eyebrow="Ambulance service"
        title="Ambulance fleet & transport"
        description={
          <p>
            Live availability of every ambulance in our fleet, from patient transport to mobile ICU. For a
            life-threatening emergency, always call 911 first.
          </p>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="tel:911"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-lg shadow-red-600/25"
          >
            <Phone className="size-4" />
            Emergency: call 911
          </a>
          <AutoRefresh seconds={30} />
        </div>
      </PageHero>

      <section className="py-12 lg:py-16">
        <div className="container-page space-y-10">
          {fleet.length > 0 ? (
            <>
              <FleetSummary fleet={fleet} />
              <div>
                <h2 className="mb-4 text-2xl font-bold text-foreground">Our fleet</h2>
                <FleetBoard fleet={fleet} />
              </div>
            </>
          ) : (
            <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center text-muted-foreground">
              Fleet status is being updated. Call {site.phone.display} to arrange transport.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-2xl font-bold text-foreground">Request patient transport</h2>
              <p className="mt-2 text-muted-foreground">
                For non-emergency transfers — hospital discharge, dialysis, clinic visits or home moves. Our dispatcher will
                call to confirm the time and the right ambulance.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
              <AmbulanceRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
