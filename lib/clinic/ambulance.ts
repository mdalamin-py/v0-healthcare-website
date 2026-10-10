import type { AmbulanceStatus, AmbulanceType } from "@/lib/supabase/types"

export const ambulanceTypes: Record<AmbulanceType, { label: string; short: string; description: string }> = {
  als: { label: "Advanced Life Support", short: "ALS", description: "Paramedic crew with cardiac monitoring and advanced drugs" },
  bls: { label: "Basic Life Support", short: "BLS", description: "EMT crew with oxygen, AED and first response care" },
  icu: { label: "Mobile ICU", short: "ICU", description: "Critical-care transport with ventilator and infusion pumps" },
  neonatal: { label: "Neonatal", short: "NICU", description: "Incubator transport for newborns" },
  transport: { label: "Patient Transport", short: "PT", description: "Non-emergency transfers, dialysis and appointments" },
}

export const ambulanceStatuses: Record<AmbulanceStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-accent/15 text-accent" },
  on_trip: { label: "On a trip", className: "bg-star/15 text-foreground" },
  maintenance: { label: "Maintenance", className: "bg-muted text-muted-foreground" },
  offline: { label: "Offline", className: "bg-destructive/10 text-destructive" },
}

export const ambulanceTypeValues = Object.keys(ambulanceTypes) as [AmbulanceType, ...AmbulanceType[]]
export const ambulanceStatusValues = Object.keys(ambulanceStatuses) as [AmbulanceStatus, ...AmbulanceStatus[]]
