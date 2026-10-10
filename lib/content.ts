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
import { serviceAreas, site } from "@/lib/site"

export type Service = {
  slug: string
  icon: LucideIcon
  title: string
  summary: string
  description: string
  features: string[]
}

export const services: Service[] = [
  {
    slug: "skilled-nursing",
    icon: Stethoscope,
    title: "Skilled Nursing",
    summary: "Licensed nurses provide wound care, medication management, and health monitoring.",
    description:
      "Our registered nurses provide comprehensive medical care in your home, ensuring professional healthcare without hospital visits.",
    features: [
      "Wound care and dressing changes",
      "IV therapy and injections",
      "Chronic disease management",
      "Post-surgical care",
      "Health monitoring and assessments",
      "Patient and family education",
    ],
  },
  {
    slug: "physical-therapy",
    icon: Activity,
    title: "Physical Therapy",
    summary: "Rehabilitation that restores movement, strength, and function after illness or injury.",
    description:
      "Our licensed physical therapists help restore mobility, strength, and function after illness, injury, or surgery.",
    features: [
      "Mobility and gait training",
      "Balance and fall prevention",
      "Strength and conditioning",
      "Pain management techniques",
      "Post-surgical rehabilitation",
      "Home exercise programs",
    ],
  },
  {
    slug: "occupational-therapy",
    icon: Brain,
    title: "Occupational Therapy",
    summary: "Regain independence in daily activities and improve quality of life.",
    description:
      "Our occupational therapists help patients regain independence in daily activities and improve quality of life.",
    features: [
      "Activities of daily living training",
      "Home safety assessments",
      "Cognitive rehabilitation",
      "Adaptive equipment training",
      "Fine motor skill development",
      "Energy conservation techniques",
    ],
  },
  {
    slug: "speech-therapy",
    icon: MessageSquare,
    title: "Speech Therapy",
    summary: "Treatment for communication and swallowing disorders.",
    description:
      "Our speech-language pathologists address communication and swallowing disorders to improve safety and quality of life.",
    features: [
      "Speech and language therapy",
      "Swallowing assessments",
      "Cognitive-communication therapy",
      "Voice therapy",
      "Aphasia treatment",
      "Dysphagia management",
    ],
  },
  {
    slug: "personal-care",
    icon: HandHeart,
    title: "Personal Care",
    summary: "Help with bathing, dressing, grooming, and mobility — with dignity.",
    description:
      "Our compassionate caregivers assist with daily activities while maintaining dignity and independence.",
    features: [
      "Bathing and personal hygiene",
      "Dressing assistance",
      "Grooming and toileting",
      "Mobility assistance",
      "Transferring and positioning",
      "Incontinence care",
    ],
  },
  {
    slug: "companion-care",
    icon: Users,
    title: "Companion Care",
    summary: "Friendly companionship and emotional support to combat isolation.",
    description:
      "Our companions provide social interaction and emotional support to combat isolation and loneliness.",
    features: [
      "Friendly conversation",
      "Accompaniment to appointments",
      "Light housekeeping",
      "Meal preparation",
      "Medication reminders",
      "Recreational activities",
    ],
  },
  {
    slug: "medication-management",
    icon: Pill,
    title: "Medication Management",
    summary: "Safe medication administration coordinated with your providers.",
    description:
      "Our team ensures safe and proper medication administration while coordinating with your healthcare providers.",
    features: [
      "Medication administration",
      "Medication reconciliation",
      "Side effect monitoring",
      "Pharmacy coordination",
      "Medication education",
      "Compliance monitoring",
    ],
  },
  {
    slug: "nutrition-services",
    icon: Utensils,
    title: "Nutrition Services",
    summary: "Nutritional support for optimal health and recovery.",
    description: "Our nutritional support helps patients maintain proper nutrition for optimal health and recovery.",
    features: [
      "Nutritional assessments",
      "Dietary planning",
      "Special diet management",
      "Meal preparation guidance",
      "Feeding assistance",
      "Hydration monitoring",
    ],
  },
  {
    slug: "medical-social-work",
    icon: Home,
    title: "Medical Social Work",
    summary: "Guidance through healthcare systems and community resources.",
    description:
      "Our social workers help patients and families navigate healthcare systems and access community resources.",
    features: [
      "Care coordination",
      "Resource referrals",
      "Counseling services",
      "Advance care planning",
      "Insurance navigation",
      "Family support",
    ],
  },
]

export const trustBadges = [
  { icon: Shield, label: "Medicare Certified" },
  { icon: Award, label: "State Licensed" },
  { icon: CheckCircle, label: "HIPAA Compliant" },
  { icon: Clock, label: "24/7 On-Call" },
] as const

export const careSteps = [
  {
    title: "Contact Us",
    description: "Call us or fill out our contact form. We will answer your questions and discuss your needs.",
  },
  {
    title: "Assessment",
    description: "Our care coordinator will visit to assess needs and create a personalized care plan.",
  },
  {
    title: "Care Team",
    description: "We match you with qualified caregivers who fit your needs and preferences.",
  },
  {
    title: "Begin Care",
    description: "Your care begins with ongoing monitoring and adjustments as needed.",
  },
] as const

export const whyChooseUs = [
  "Experienced, licensed healthcare professionals",
  "Personalized care plans tailored to your needs",
  "Coordination with your physicians and specialists",
  "Flexible scheduling including weekends",
  "Bilingual staff (English & Spanish)",
  "Medicare, Medicaid, and most insurances accepted",
] as const

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

export const faqs = [
  {
    question: "Do you accept Medicare and Medicaid?",
    answer:
      "Yes. We are Medicare certified and accept Medicaid / Medi-Cal along with most major private insurance plans, including Blue Cross Blue Shield, Aetna, United Healthcare, Cigna, Kaiser Permanente, and Humana.",
  },
  {
    question: "Do I need a doctor's referral?",
    answer:
      "Medicare-covered home health services require an order from your physician. If you don't have one yet, call us — our care coordinators work directly with your doctor to arrange it.",
  },
  {
    question: "How quickly can services start?",
    answer:
      "After your first call, a care coordinator schedules an in-home assessment and builds your personalized care plan. Care begins as soon as the plan and your care team are in place.",
  },
  {
    question: "What areas do you serve?",
    answer: `We serve ${site.address.city} and the surrounding Central Valley communities, including ${serviceAreas
      .slice(1)
      .join(", ")}.`,
  },
  {
    question: "How do I verify my insurance coverage?",
    answer:
      "Contact us for a free benefits verification. Our team checks your coverage and handles the insurance paperwork so you can focus on your health.",
  },
  {
    question: "Is support available after hours?",
    answer: `Our office is open ${site.hours.office}, and our clinical team is on call 24/7 for current patients.`,
  },
] as const

export type Review = {
  name: string
  date: string
  rating: number
  text: string
  service: string
  doctor?: string
}
