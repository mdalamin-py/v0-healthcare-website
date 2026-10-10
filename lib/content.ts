import {
  Activity,
  Award,
  Brain,
  CheckCircle,
  Clock,
  HandHeart,
  Home,
  MessageSquare,
  Pill,
  Shield,
  Stethoscope,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react"
import type { Dictionary } from "@/lib/i18n/dictionaries"

// Text for these lives in the dictionaries (lib/i18n), keyed by slug or position.

export type Service = {
  slug: string
  icon: LucideIcon
  title: string
  summary: string
  description: string
  features: string[]
}

const serviceIcons: [slug: string, icon: LucideIcon][] = [
  ["skilled-nursing", Stethoscope],
  ["physical-therapy", Activity],
  ["occupational-therapy", Brain],
  ["speech-therapy", MessageSquare],
  ["personal-care", HandHeart],
  ["companion-care", Users],
  ["medication-management", Pill],
  ["nutrition-services", Utensils],
  ["medical-social-work", Home],
]

export function getServices(t: Dictionary): Service[] {
  return serviceIcons.map(([slug, icon]) => ({ slug, icon, ...t.content.services[slug] }))
}

const trustBadgeIcons: LucideIcon[] = [Shield, Award, CheckCircle, Clock]

export function getTrustBadges(t: Dictionary) {
  return t.content.trustBadges.map((label, index) => ({ label, icon: trustBadgeIcons[index] }))
}

export const insuranceProviders = [
  "Medicare",
  "Medicaid / Medi-Cal",
  "Blue Cross Blue Shield",
  "Aetna",
  "United Healthcare",
  "Cigna",
  "Kaiser Permanente",
  "Humana",
] as const

export type Review = {
  name: string
  date: string
  rating: number
  text: string
  service: string
  doctor?: string
}
