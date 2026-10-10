"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { CalendarPlus, ChevronDown, Clock, MapPin, Menu, Phone, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { isActivePath, isGroup, navigation, type NavGroup } from "@/lib/navigation"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

function DesktopDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const active = group.items.some((item) => isActivePath(pathname, item.href))

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    const onClick = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [open])

  return (
    <li ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:px-4",
          active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-muted hover:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3">
          <ul className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-border bg-popover p-2 shadow-2xl shadow-primary/10">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted",
                    isActivePath(pathname, item.href) && "bg-primary/5",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden bg-slate-950 text-slate-300 md:block">
        <div className="container-page flex h-10 items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              {site.hours.office} · {site.hours.onCall}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              {site.address.street}, {site.address.city}, {site.address.region}
            </span>
          </div>
          <a href={site.phone.href} className="flex items-center gap-1.5 font-semibold text-white transition-colors hover:text-primary">
            <Phone className="size-3.5" />
            {site.phone.display}
          </a>
        </div>
      </div>

      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled || menuOpen
            ? "border-border bg-background/85 shadow-sm backdrop-blur-xl"
            : "border-transparent bg-background/60 backdrop-blur-md",
        )}
      >
        <nav className="container-page flex h-16 items-center justify-between md:h-20" aria-label="Main">
          <Logo />

          <ul className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 shadow-sm lg:flex">
            {navigation.map((entry) =>
              isGroup(entry) ? (
                <DesktopDropdown key={entry.label} group={entry} pathname={pathname} />
              ) : (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={isActivePath(pathname, entry.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:px-4",
                      isActivePath(pathname, entry.href)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {entry.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/account"
              aria-label="My account"
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:text-primary",
                isActivePath(pathname, "/account") && "border-primary/40 text-primary",
              )}
            >
              <UserRound className="size-[18px]" />
            </Link>
            <Button asChild className="hidden rounded-full shadow-lg shadow-primary/25 xl:inline-flex">
              <Link href="/appointments/book">
                <CalendarPlus className="size-4" />
                Book Appointment
              </Link>
            </Button>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-border lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-4">
              {navigation.map((entry) =>
                isGroup(entry) ? (
                  <li key={entry.label}>
                    <button
                      type="button"
                      aria-expanded={openGroup === entry.label}
                      onClick={() => setOpenGroup((value) => (value === entry.label ? null : entry.label))}
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 font-medium text-foreground/80 hover:bg-muted"
                    >
                      {entry.label}
                      <ChevronDown className={cn("size-4 transition-transform", openGroup === entry.label && "rotate-180")} />
                    </button>
                    {openGroup === entry.label && (
                      <ul className="mb-2 ml-4 space-y-1 border-l border-border pl-3">
                        {entry.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                isActivePath(pathname, item.href) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted",
                              )}
                            >
                              <item.icon className="size-4 text-primary" />
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      aria-current={isActivePath(pathname, entry.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-4 py-3 font-medium transition-colors",
                        isActivePath(pathname, entry.href) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted",
                      )}
                    >
                      {entry.label}
                    </Link>
                  </li>
                ),
              )}
              <li className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <a href={site.phone.href}>
                    <Phone className="size-4" />
                    Call Us
                  </a>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/appointments/book">Book Appointment</Link>
                </Button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}
