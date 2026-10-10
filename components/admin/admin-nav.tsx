"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, LayoutDashboard, Moon, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/on-call", label: "On-call", icon: Moon },
]

export function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))

  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {links.map((link) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
