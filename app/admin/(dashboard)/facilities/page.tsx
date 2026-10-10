import { Clock, EyeOff, Hospital, MapPin, Phone, Siren } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { FacilityControls } from "@/components/admin/facility-controls"
import { FacilityForm } from "@/components/admin/facility-form"
import { requireAdmin } from "@/lib/admin/auth"
import { facilityTypes, formatMiles, sortByDistance } from "@/lib/clinic/facilities"
import { site } from "@/lib/site"
import type { NearbyFacility } from "@/lib/supabase/types"

export default async function AdminFacilitiesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from("nearby_facilities").select("*")
  const facilities = sortByDistance((data ?? []) as NearbyFacility[], site.address.geo)
  const live = facilities.filter((facility) => facility.is_active).length

  return (
    <>
      <AdminPageHeader
        title="Nearby facilities"
        description={`${live} of ${facilities.length} shown on the website · sorted by distance from the clinic`}
      />

      <ul className="space-y-3">
        {facilities.map(({ distance, ...facility }) => (
          <li key={facility.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-start">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Hospital className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{facility.name}</p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{facilityTypes[facility.type].label}</span>
                {facility.has_emergency && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                    <Siren className="size-3" />
                    ER
                  </span>
                )}
                {facility.open_24h && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    <Clock className="size-3" />
                    24/7
                  </span>
                )}
                {!facility.is_active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <EyeOff className="size-3" />
                    Hidden
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {facility.address} · {formatMiles(distance)}
                </span>
                {facility.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {facility.phone}
                  </span>
                )}
              </p>
            </div>
            <div className="lg:w-[34rem]">
              <FacilityControls facility={facility} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-1 font-semibold text-foreground">Add a facility</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Copy the coordinates from Google Maps (right-click the place → the first line shows latitude, longitude).
        </p>
        <FacilityForm />
      </div>
    </>
  )
}
