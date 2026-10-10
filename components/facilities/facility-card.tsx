import { Clock, ExternalLink, MapPin, Navigation, Phone, Siren } from "lucide-react"
import { directionsUrl, facilityTypes, formatMiles } from "@/lib/clinic/facilities"
import type { NearbyFacility } from "@/lib/supabase/types"

export function FacilityCard({ facility, distance }: { facility: NearbyFacility; distance: number }) {
  return (
    <li className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {facilityTypes[facility.type].label}
          </span>
          {facility.has_emergency && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600">
              <Siren className="size-3" />
              Emergency room
            </span>
          )}
          {facility.open_24h && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
              <Clock className="size-3" />
              Open 24/7
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">{formatMiles(distance)}</span>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground">{facility.name}</h3>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        {facility.address}
      </p>
      {facility.hours && !facility.open_24h && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          {facility.hours}
        </p>
      )}
      {facility.services.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {facility.services.map((service) => (
            <li key={service} className="rounded-md bg-muted/70 px-2 py-0.5 text-xs text-muted-foreground">
              {service}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {facility.phone && (
          <a
            href={`tel:${facility.phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-sm"
          >
            <Phone className="size-3.5" />
            {facility.phone}
          </a>
        )}
        <a
          href={directionsUrl(facility)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:border-primary/40"
        >
          <Navigation className="size-3.5" />
          Directions
        </a>
        {facility.website && (
          <a
            href={facility.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${facility.name} website`}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </li>
  )
}
