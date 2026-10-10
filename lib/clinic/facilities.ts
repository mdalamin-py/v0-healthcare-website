import type { FacilityType, NearbyFacility } from "@/lib/supabase/types"

export const facilityTypes: Record<FacilityType, { label: string; plural: string }> = {
  hospital: { label: "Hospital", plural: "Hospitals" },
  urgent_care: { label: "Urgent care", plural: "Urgent care" },
  clinic: { label: "Clinic", plural: "Clinics" },
  pharmacy: { label: "Pharmacy", plural: "Pharmacies" },
  diagnostic: { label: "Diagnostic centre", plural: "Diagnostics" },
}

export const facilityTypeValues = Object.keys(facilityTypes) as [FacilityType, ...FacilityType[]]

export type GeoPoint = { latitude: number; longitude: number }

// Great-circle distance (haversine) in miles.
export function distanceMiles(from: GeoPoint, to: GeoPoint) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = radians(to.latitude - from.latitude)
  const dLon = radians(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function sortByDistance<T extends GeoPoint>(items: T[], origin: GeoPoint) {
  return items
    .map((item) => ({ ...item, distance: distanceMiles(origin, item) }))
    .sort((a, b) => a.distance - b.distance)
}

export function directionsUrl(facility: Pick<NearbyFacility, "latitude" | "longitude">) {
  return `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`
}

export function formatMiles(miles: number) {
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`
}
