"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, LayoutDashboard, ListOrdered, Moon, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/queue", label: "Live queue", icon: ListOrdered },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/on-call", label: "On-call", icon: Moon },
]

export function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))

  return (
    <nav aria-label="Admin">
      <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:block">Clinic</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10",
                  )}
                >
                  <link.icon className="size-4" />
                </span>
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
