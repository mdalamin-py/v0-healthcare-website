import Link from "next/link"
import { ArrowRight, Hospital, Navigation, Phone } from "lucide-react"
import { directionsUrl, formatMiles, sortByDistance } from "@/lib/clinic/facilities"
import { site } from "@/lib/site"
import type { NearbyFacility } from "@/lib/supabase/types"

export function NearestEmergency({ facilities }: { facilities: NearbyFacility[] }) {
  const nearest = sortByDistance(
    facilities.filter((facility) => facility.has_emergency),
    site.address.geo,
  ).slice(0, 3)
  if (nearest.length === 0) return null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
            <Hospital className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">Nearest emergency rooms</h2>
            <p className="text-sm text-muted-foreground">Distance from our clinic</p>
          </div>
        </div>
        <Link href="/nearby" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          All nearby hospitals & clinics
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <ul className="mt-5 divide-y divide-border">
        {nearest.map((facility) => (
          <li key={facility.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{facility.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatMiles(facility.distance)} · {facility.address}
              </p>
            </div>
            <div className="flex gap-2">
              {facility.phone && (
                <a
                  href={`tel:${facility.phone.replace(/[^\d+]/g, "")}`}
                  aria-label={`Call ${facility.name}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium hover:border-primary/40"
                >
                  <Phone className="size-3.5" />
                  Call
                </a>
              )}
              <a
                href={directionsUrl(facility)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-3 text-sm font-semibold text-white"
              >
                <Navigation className="size-3.5" />
                Directions
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
