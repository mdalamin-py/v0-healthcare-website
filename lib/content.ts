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

export const stats = [
  { value: site.rating.value, label: "Google Rating" },
  { value: site.rating.count, label: "Google Reviews" },
  { value: "5+", label: "Years Serving Fresno" },
  { value: "24/7", label: "On-Call Support" },
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
}

export const reviews: Review[] = [
  {
    name: "Maria G.",
    date: "2 months ago",
    rating: 5,
    text: "Dignity Home Health Care has been a blessing for our family. The nurses are incredibly compassionate and professional. My mother looks forward to their visits every day. They treat her with such respect and genuine care. I cannot recommend them enough to anyone looking for quality home health care in Fresno.",
    service: "Skilled Nursing",
  },
  {
    name: "Robert T.",
    date: "3 months ago",
    rating: 5,
    text: "After my hip replacement surgery, the physical therapist from Dignity helped me regain my mobility. Their patience and expertise made all the difference in my recovery. Within weeks, I was walking again with confidence. The team was always on time and very professional.",
    service: "Physical Therapy",
  },
  {
    name: "Susan L.",
    date: "1 month ago",
    rating: 5,
    text: "The caregivers treat my father with such dignity and respect. They truly live up to their name. I can finally have peace of mind knowing he is in good hands. The staff is well-trained, kind, and always goes above and beyond. Thank you for giving our family such excellent care.",
    service: "Personal Care",
  },
  {
    name: "James M.",
    date: "4 months ago",
    rating: 5,
    text: "Outstanding service from start to finish. The intake process was smooth, and they matched us with a wonderful caregiver who has become like family. My wife receives excellent care, and I appreciate how they keep me informed about her progress. Five stars all around!",
    service: "Companion Care",
  },
  {
    name: "Patricia H.",
    date: "2 weeks ago",
    rating: 5,
    text: "I was hesitant about home health care at first, but Dignity has exceeded all my expectations. The nursing staff is top-notch, and they coordinate perfectly with my doctors. Having professional care at home has made managing my diabetes so much easier.",
    service: "Skilled Nursing",
  },
  {
    name: "Michael R.",
    date: "1 month ago",
    rating: 5,
    text: "My mother had a stroke and needed speech therapy. The speech therapist from Dignity was patient, encouraging, and skilled. Mom has made remarkable progress in her communication abilities. We are so grateful for their dedication and expertise.",
    service: "Speech Therapy",
  },
  {
    name: "Jennifer K.",
    date: "3 weeks ago",
    rating: 5,
    text: "The occupational therapist helped my dad learn to dress himself again after his stroke. Small victories like this mean the world to us. The entire team at Dignity is compassionate and truly cares about their patients' quality of life.",
    service: "Occupational Therapy",
  },
  {
    name: "David S.",
    date: "2 months ago",
    rating: 4,
    text: "Very professional and caring staff. They helped my grandmother with her daily activities while I was at work. The only reason I am giving 4 stars instead of 5 is because scheduling was a bit challenging at first, but once we got into a routine, everything was perfect.",
    service: "Personal Care",
  },
  {
    name: "Linda W.",
    date: "5 months ago",
    rating: 5,
    text: "Dignity Home Health Care provided excellent care for my husband during his cancer treatment. The nurses were knowledgeable, compassionate, and always available when we had questions. They made a difficult time much more manageable for our entire family.",
    service: "Skilled Nursing",
  },
  {
    name: "Thomas B.",
    date: "1 month ago",
    rating: 5,
    text: "I am so impressed with the level of care my mother receives. The caregivers are not just employees — they genuinely care about her wellbeing. They remember her preferences, engage her in conversation, and treat her like family. Cannot thank them enough!",
    service: "Companion Care",
  },
  {
    name: "Angela C.",
    date: "6 weeks ago",
    rating: 5,
    text: "The physical therapy team helped me recover from knee surgery faster than I expected. They were motivating, professional, and always on time. My surgeon was impressed with my progress. Highly recommend their rehabilitation services!",
    service: "Physical Therapy",
  },
  {
    name: "Richard N.",
    date: "4 weeks ago",
    rating: 5,
    text: "From the first phone call, I knew Dignity was different. They took the time to understand our needs and matched us with the perfect caregiver. My dad is happier and healthier thanks to their excellent care. They truly embody their name.",
    service: "Personal Care",
  },
]
