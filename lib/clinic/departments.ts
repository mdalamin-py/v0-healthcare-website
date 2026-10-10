import { Activity, Brain, HeartPulse, type LucideIcon, Pill, Stethoscope, UserRound, Users } from "lucide-react"
import { fill } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import type { DoctorWithSchedules } from "@/lib/supabase/types"

export type Department = {
  slug: string
  /** English specialty name as stored on doctors. */
  specialty: string
  name: string
  icon: LucideIcon
  summary: string
  description: string
  conditions: string[]
  services: string[]
  doctors: DoctorWithSchedules[]
}

// Text lives in the dictionaries (departmentsPage.content); icons stay here.
const icons: Record<string, LucideIcon> = {
  "Geriatric Medicine": UserRound,
  "Internal Medicine": Stethoscope,
  Cardiology: HeartPulse,
  "Family Medicine": Users,
  Endocrinology: Pill,
  "Physical Therapy": Activity,
}

export function departmentSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Builds departments from known specialties plus any specialty that has doctors. */
export function buildDepartments(doctors: DoctorWithSchedules[], t: Dictionary): Department[] {
  const page = t.departmentsPage
  const names = new Set([...Object.keys(icons), ...doctors.map((doctor) => doctor.specialty)])

  return Array.from(names)
    .map((specialty) => {
      const name = t.clinic.specialties[specialty] ?? specialty
      const text = page.content[specialty] ?? {
        summary: fill(page.fallbackSummary, { name }),
        description: fill(page.fallbackDescription, { name }),
        conditions: [],
        services: [],
      }
      return {
        slug: departmentSlug(specialty),
        specialty,
        name,
        icon: icons[specialty] ?? Brain,
        ...text,
        doctors: doctors.filter((doctor) => doctor.specialty === specialty),
      }
    })
    .sort((a, b) => b.doctors.length - a.doctors.length || a.specialty.localeCompare(b.specialty))
}
