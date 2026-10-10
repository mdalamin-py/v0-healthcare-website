import { Home, Hospital, type LucideIcon, Video } from "lucide-react"
import type { VisitType } from "@/lib/supabase/types"

export const visitTypes: Record<VisitType, { label: string; description: string; icon: LucideIcon }> = {
  in_clinic: { label: "In-clinic visit", description: "See the doctor at our Fresno office", icon: Hospital },
  video: { label: "Video consultation", description: "Secure video call from home", icon: Video },
  home_visit: { label: "Home visit", description: "A clinician comes to your home", icon: Home },
}

export const visitTypeValues = Object.keys(visitTypes) as [VisitType, ...VisitType[]]

/** Safe lookup for values read from the database. */
export function visitTypeMeta(type: VisitType | null | undefined) {
  return visitTypes[type ?? "in_clinic"] ?? visitTypes.in_clinic
}
