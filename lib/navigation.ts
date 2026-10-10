import {
  Building2,
  CalendarClock,
  CalendarPlus,
  HeartHandshake,
  type LucideIcon,
  Search,
  Star,
  Stethoscope,
  Users,
} from "lucide-react"

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }
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
    ],
  },
  {
    label: "Patients",
    items: [
      { href: "/appointments/book", label: "Book Appointment", description: "Pick a doctor and get a serial number", icon: CalendarPlus },
      { href: "/appointments/status", label: "Check Appointment", description: "View status or cancel a booking", icon: Search },
    ],
  },
  {
    label: "About",
    items: [
      { href: "/about", label: "About Us", description: "Our mission, values and leadership", icon: Users },
      { href: "/reviews", label: "Patient Reviews", description: "What families say about our care", icon: Star },
    ],
  },
  { href: "/contact", label: "Contact" },
]

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
