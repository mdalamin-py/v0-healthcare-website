"use client"

import { useMemo, useState } from "react"
import { Crosshair, Loader2, Siren } from "lucide-react"
import { FacilityCard } from "@/components/facilities/facility-card"
import { facilityTypes, sortByDistance, type GeoPoint } from "@/lib/clinic/facilities"
import type { FacilityType, NearbyFacility } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const ALL = "all"

type Origin = GeoPoint & { label: string }

export function FacilityFinder({ facilities, clinic }: { facilities: NearbyFacility[]; clinic: Origin }) {
  const [type, setType] = useState<FacilityType | typeof ALL>(ALL)
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [origin, setOrigin] = useState<Origin>(clinic)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const types = (Object.keys(facilityTypes) as FacilityType[]).filter((value) => facilities.some((f) => f.type === value))
  const visible = useMemo(
    () =>
      sortByDistance(
        facilities.filter((f) => (type === ALL || f.type === type) && (!emergencyOnly || f.has_emergency)),
        origin,
      ),
    [facilities, type, emergencyOnly, origin],
  )
  const fromClinic = origin === clinic

  const locate = () => {
    if (!navigator.geolocation) return setLocationError("Location is not supported by this browser.")
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ latitude: coords.latitude, longitude: coords.longitude, label: "your location" })
        setLocating(false)
      },
      () => {
        setLocationError("Location unavailable — distances are from our clinic.")
        setLocating(false)
      },
      { timeout: 10_000, maximumAge: 300_000 },
    )
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
    )

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by facility type" className="flex flex-wrap gap-2">
          {[ALL, ...types].map((value) => {
            const active = type === value
            const count = value === ALL ? facilities.length : facilities.filter((f) => f.type === value).length
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setType(value as FacilityType | typeof ALL)}
                className={chip(active)}
              >
                {value === ALL ? "All" : facilityTypes[value as FacilityType].plural}
                <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              </button>
            )
          })}
          <button type="button" aria-pressed={emergencyOnly} onClick={() => setEmergencyOnly((value) => !value)} className={chip(emergencyOnly)}>
            <Siren className="size-4" />
            Emergency rooms
          </button>
        </div>
        <button
          type="button"
          onClick={fromClinic ? locate : () => setOrigin(clinic)}
          disabled={locating}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          {fromClinic ? "Use my location" : "Measure from our clinic"}
        </button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "place" : "places"} · nearest first from {origin.label}
        {locationError && <span className="text-destructive"> · {locationError}</span>}
      </p>

      {visible.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ distance, ...facility }) => (
            <FacilityCard key={facility.id} facility={facility} distance={distance} />
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No places match these filters.
        </p>
      )}
    </div>
  )
}
