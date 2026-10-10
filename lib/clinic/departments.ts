import { Activity, Brain, HeartPulse, type LucideIcon, Pill, Stethoscope, UserRound, Users } from "lucide-react"
import type { DoctorWithSchedules } from "@/lib/supabase/types"

type DepartmentContent = {
  icon: LucideIcon
  summary: string
  description: string
  conditions: string[]
  services: string[]
}

export type Department = DepartmentContent & {
  slug: string
  name: string
  doctors: DoctorWithSchedules[]
}

const content: Record<string, DepartmentContent> = {
  "Geriatric Medicine": {
    icon: UserRound,
    summary: "Comprehensive care for older adults and their families.",
    description:
      "Our geriatric team focuses on the whole person — managing multiple conditions, reviewing medications, and planning care that keeps older adults safe, independent and comfortable at home.",
    conditions: ["Memory concerns", "Falls and frailty", "Multiple chronic conditions", "Polypharmacy", "Incontinence"],
    services: ["Comprehensive geriatric assessment", "Medication review", "Advance care planning", "Caregiver guidance"],
  },
  "Internal Medicine": {
    icon: Stethoscope,
    summary: "Diagnosis and long-term care for adult health conditions.",
    description:
      "Internists diagnose and manage a wide range of adult illnesses, coordinate specialist care, and help patients prevent disease through regular check-ups and screenings.",
    conditions: ["Hypertension", "Diabetes", "High cholesterol", "Respiratory infections", "Thyroid disorders"],
    services: ["Annual physicals", "Chronic disease management", "Preventive screenings", "Post-hospital follow-up"],
  },
  Cardiology: {
    icon: HeartPulse,
    summary: "Heart and blood vessel care, from prevention to recovery.",
    description:
      "Our cardiology service helps patients manage heart conditions, recover after hospital stays, and reduce cardiovascular risk with personalized treatment plans.",
    conditions: ["Heart failure", "Coronary artery disease", "Arrhythmias", "High blood pressure", "Post-cardiac surgery"],
    services: ["Cardiac consultation", "Heart failure management", "Blood pressure monitoring", "Cardiac rehab guidance"],
  },
  "Family Medicine": {
    icon: Users,
    summary: "Everyday care for every member of the family.",
    description:
      "Family physicians provide continuous, whole-person care for patients of all ages — from routine check-ups and vaccinations to managing ongoing health conditions.",
    conditions: ["Colds and flu", "Allergies", "Minor injuries", "Chronic conditions", "Preventive care"],
    services: ["Wellness visits", "Vaccinations", "Acute illness visits", "Health counseling"],
  },
  Endocrinology: {
    icon: Pill,
    summary: "Specialist care for diabetes, thyroid and hormone disorders.",
    description:
      "Our endocrinologists diagnose and treat hormone-related conditions, with a strong focus on helping patients manage diabetes and thyroid disease day to day.",
    conditions: ["Type 1 & type 2 diabetes", "Thyroid disorders", "Osteoporosis", "Obesity", "Adrenal disorders"],
    services: ["Diabetes management plans", "Insulin education", "Thyroid evaluation", "Bone health assessment"],
  },
  "Physical Therapy": {
    icon: Activity,
    summary: "Restore movement, strength and independence.",
    description:
      "Licensed physical therapists help patients recover after surgery, injury or illness with personalized exercise programs, balance training and fall prevention.",
    conditions: ["Post-surgical recovery", "Joint replacement", "Back and neck pain", "Balance problems", "Stroke recovery"],
    services: ["Mobility and gait training", "Strength programs", "Fall prevention", "Home exercise plans"],
  },
}

const fallback = (name: string): DepartmentContent => ({
  icon: Brain,
  summary: `Specialist ${name.toLowerCase()} care from our experienced team.`,
  description: `Our ${name} specialists provide expert diagnosis, treatment and follow-up care, coordinated with your home care team.`,
  conditions: [],
  services: [],
})

export function departmentSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Builds departments from known specialties plus any specialty that has doctors. */
export function buildDepartments(doctors: DoctorWithSchedules[]): Department[] {
  const names = new Set([...Object.keys(content), ...doctors.map((doctor) => doctor.specialty)])

  return Array.from(names)
    .map((name) => ({
      slug: departmentSlug(name),
      name,
      ...(content[name] ?? fallback(name)),
      doctors: doctors.filter((doctor) => doctor.specialty === name),
    }))
    .sort((a, b) => b.doctors.length - a.doctors.length || a.name.localeCompare(b.name))
}
