import { Ambulance, BedDouble, type LucideIcon, PhoneCall } from "lucide-react"
import type { DutyType } from "@/lib/supabase/types"

export const dutyTypes: Record<DutyType, { label: string; description: string; icon: LucideIcon; className: string }> = {
  on_call: {
    label: "On-call",
    description: "Answers urgent calls from patients at home",
    icon: PhoneCall,
    className: "bg-primary/10 text-primary",
  },
  emergency: {
    label: "Emergency",
    description: "Covers the emergency department",
    icon: Ambulance,
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  ward: {
    label: "Ward duty",
    description: "Ward rounds and inpatient care",
    icon: BedDouble,
    className: "bg-accent/15 text-accent",
  },
}

export const dutyTypeValues = Object.keys(dutyTypes) as [DutyType, ...DutyType[]]

export function dutyMeta(type: DutyType | null | undefined) {
  return dutyTypes[type ?? "on_call"] ?? dutyTypes.on_call
}
