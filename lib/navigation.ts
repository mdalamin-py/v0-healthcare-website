import {
  Activity,
  Ambulance,
  Building2,
  CalendarClock,
  CalendarPlus,
  GraduationCap,
  HeartHandshake,
  Hospital,
  ListOrdered,
  type LucideIcon,
  Search,
  Siren,
  Star,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import type { Dictionary } from "@/lib/i18n/dictionaries"

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon }
export type NavFeature = { eyebrow: string; title: string; description: string; href: string; cta: string }
export type NavGroup = { id: GroupId; label: string; items: NavItem[]; feature: NavFeature }
export type NavEntry = { href: string; label: string } | NavGroup

type GroupId = keyof Dictionary["nav"]["groups"]

// Structure only; labels come from the active dictionary.
const structure: ({ href: string; text: "home" | "contact" } | { id: GroupId; feature: string; items: [string, LucideIcon][] })[] = [
  { href: "/", text: "home" },
  {
    id: "care",
    feature: "/schedule",
    items: [
      ["/doctors", Stethoscope],
      ["/departments", Building2],
      ["/services", HeartHandshake],
      ["/schedule", CalendarClock],
      ["/interns", GraduationCap],
      ["/ambulance", Ambulance],
      ["/nearby", Hospital],
      ["/emergency", Siren],
    ],
  },
  {
    id: "patients",
    feature: "/appointments/book",
    items: [
      ["/appointments/book", CalendarPlus],
      ["/queue", ListOrdered],
      ["/ot", Activity],
      ["/account", UserRound],
      ["/appointments/status", Search],
    ],
  },
  {
    id: "about",
    feature: "/reviews",
    items: [
      ["/about", Users],
      ["/reviews", Star],
    ],
  },
  { href: "/contact", text: "contact" },
]

export function getNavigation(t: Dictionary): NavEntry[] {
  return structure.map((entry) => {
    if ("href" in entry) return { href: entry.href, label: t.nav[entry.text] }
    const group = t.nav.groups[entry.id]
    return {
      id: entry.id,
      label: group.label,
      items: entry.items.map(([href, icon]) => ({ href, icon, ...t.nav.items[href] })),
      feature: { eyebrow: group.eyebrow, title: group.title, description: group.description, cta: group.cta, href: entry.feature },
    }
  })
}

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
