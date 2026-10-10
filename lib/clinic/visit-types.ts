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

export const visitInstructions: Record<VisitType, string> = {
  in_clinic: "Please arrive 15 minutes early and bring a photo ID and insurance card.",
  video: "We will email or text you a secure video link before your session. Please have your ID and insurance card ready.",
  home_visit: "Our clinician will call before arriving. Please have your ID, insurance card and current medications ready.",
}
