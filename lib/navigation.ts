import {
  Ambulance,
  Building2,
  GraduationCap,
  CalendarClock,
  CalendarPlus,
  ListOrdered,
  Siren,
  HeartHandshake,
  type LucideIcon,
  Search,
  Star,
  UserRound,
  Stethoscope,
  Users,
} from "lucide-react"

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon }
export type NavFeature = { eyebrow: string; title: string; description: string; href: string; cta: string }
export type NavGroup = { label: string; items: NavItem[]; feature: NavFeature }
export type NavEntry = { href: string; label: string } | NavGroup

export const navigation: NavEntry[] = [
  { href: "/", label: "Home" },
  {
    label: "Find Care",
    items: [
      { href: "/doctors", label: "Our Doctors", description: "Search specialists and view profiles", icon: Stethoscope },
      { href: "/departments", label: "Departments", description: "Specialties and the doctors in each", icon: Building2 },
      { href: "/services", label: "Services", description: "Nursing, therapy and personal care", icon: HeartHandshake },
      { href: "/schedule", label: "Schedule & On-call", description: "Clinic hours and who is on call now", icon: CalendarClock },
      { href: "/interns", label: "Intern Doctors", description: "Intern list and ward & emergency duties", icon: GraduationCap },
      { href: "/ambulance", label: "Ambulance Service", description: "Live fleet status and transport requests", icon: Ambulance },
      { href: "/emergency", label: "Emergency & Urgent Care", description: "When to call 911 and urgent callbacks", icon: Siren },
    ],
    feature: {
      eyebrow: "24/7 support",
      title: "A doctor is always on call",
      description: "See who is on call right now and the clinic timetable for the week.",
      href: "/schedule",
      cta: "View on-call roster",
    },
  },
  {
    label: "Patients",
    items: [
      { href: "/appointments/book", label: "Book Appointment", description: "Pick a doctor and get a serial number", icon: CalendarPlus },
      { href: "/queue", label: "Live Queue", description: "See the serial each doctor is serving now", icon: ListOrdered },
      { href: "/account", label: "My Account", description: "Your appointments and profile", icon: UserRound },
      { href: "/appointments/status", label: "Check Appointment", description: "Look up a booking by reference", icon: Search },
    ],
    feature: {
      eyebrow: "Online booking",
      title: "Book in under a minute",
      description: "Choose a doctor and visit type, then get your serial number instantly.",
      href: "/appointments/book",
      cta: "Book an appointment",
    },
  },
  {
    label: "About",
    items: [
      { href: "/about", label: "About Us", description: "Our mission, values and leadership", icon: Users },
      { href: "/reviews", label: "Patient Reviews", description: "What families say about our care", icon: Star },
    ],
    feature: {
      eyebrow: "Rated 4.9 on Google",
      title: "Trusted by Fresno families",
      description: "Compassionate, professional care that preserves independence and dignity.",
      href: "/reviews",
      cta: "Read patient reviews",
    },
  },
  { href: "/contact", label: "Contact" },
]

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
