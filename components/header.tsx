"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, CalendarPlus, ChevronDown, Menu, Phone, Sparkles, UserRound, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { isActivePath, isGroup, navigation, type NavGroup } from "@/lib/navigation"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

function MegaPanel({ group, pathname, onNavigate }: { group: NavGroup; pathname: string; onNavigate: () => void }) {
  return (
    <div className="absolute inset-x-0 top-full z-50 pt-3">
      <div className="animate-in fade-in slide-in-from-top-2 grid gap-2 overflow-hidden rounded-3xl border border-border bg-popover p-3 shadow-2xl shadow-slate-950/10 duration-200 md:grid-cols-[1fr_18rem]">
        <ul className="grid content-start gap-1 sm:grid-cols-2">
          {group.items.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-full items-start gap-4 rounded-2xl p-4 transition-colors hover:bg-muted",
                    active && "bg-primary/5",
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary ring-1 ring-primary/10 transition-all group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25">
                    <item.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      {item.label}
                      <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href={group.feature.href}
          onClick={onNavigate}
          className="group relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-white md:flex md:flex-col"
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="size-3.5" />
            {group.feature.eyebrow}
          </span>
          <span className="relative mt-auto pt-10 font-display text-xl font-bold leading-snug">{group.feature.title}</span>
          <span className="relative mt-2 text-sm text-white/85">{group.feature.description}</span>
          <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
            {group.feature.cta}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  )
}

function MobileMenu({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="animate-in fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />
      <div className="animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-2xl duration-300">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-7">
            {navigation.map((entry) =>
              isGroup(entry) ? (
                <li key={entry.label}>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {entry.label}
                  </p>
                  <ul className="space-y-1">
                    {entry.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl p-2.5 transition-colors",
                            isActivePath(pathname, item.href) ? "bg-primary/10" : "hover:bg-muted",
                          )}
                        >
                          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                            <item.icon className="size-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium text-foreground">{item.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    aria-current={isActivePath(pathname, entry.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-3 py-3 text-lg font-semibold transition-colors",
                      isActivePath(pathname, entry.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {entry.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
        <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
          <a
            href={site.phone.href}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card font-medium"
          >
            <Phone className="size-4" />
            Call us
          </a>
          <Link
            href="/appointments/book"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-lg shadow-primary/25"
          >
            <CalendarPlus className="size-4" />
            Book now
          </Link>
        </div>
      </div>
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openGroup) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenGroup(null)
    const onClick = (event: MouseEvent) => !navRef.current?.contains(event.target as Node) && setOpenGroup(null)
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [openGroup])

  const openWithHover = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenGroup(label)
  }
  const closeWithDelay = () => {
    closeTimer.current = setTimeout(() => setOpenGroup(null), 150)
  }

  const activeGroup = navigation.find((entry) => isGroup(entry) && entry.label === openGroup) as NavGroup | undefined

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "overflow-hidden bg-gradient-to-r from-primary via-primary to-accent text-white transition-all duration-300",
          scrolled ? "max-h-0" : "max-h-10",
        )}
      >
        <div className="container-page flex h-9 items-center justify-center gap-2 text-xs font-medium sm:justify-between">
          <p className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            {site.hours.onCall} · {site.hours.office}
          </p>
          <a href={site.phone.href} className="hidden items-center gap-1.5 hover:underline sm:flex">
            <Phone className="size-3.5" />
            {site.phone.display}
          </a>
        </div>
      </div>

      <div className={cn("px-3 transition-all duration-300 sm:px-4", scrolled ? "pt-2" : "pt-3")}>
        <div
          ref={navRef}
          className={cn(
            "relative mx-auto max-w-7xl rounded-2xl border transition-all duration-300",
            scrolled || openGroup
              ? "border-border bg-background/80 shadow-xl shadow-slate-950/5 backdrop-blur-2xl"
              : "border-border/60 bg-background/60 shadow-sm backdrop-blur-xl",
          )}
          onMouseLeave={closeWithDelay}
        >
          <nav className="flex h-16 items-center justify-between gap-4 px-3 sm:px-4" aria-label="Main">
            <Logo />

            <ul className="hidden items-center gap-0.5 lg:flex">
              {navigation.map((entry) => {
                if (isGroup(entry)) {
                  const active = entry.items.some((item) => isActivePath(pathname, item.href))
                  const open = openGroup === entry.label
                  return (
                    <li key={entry.label} onMouseEnter={() => openWithHover(entry.label)}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenGroup(open ? null : entry.label)}
                        className={cn(
                          "relative flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                          open ? "bg-muted text-foreground" : active ? "text-primary" : "text-foreground/70 hover:text-foreground",
                        )}
                      >
                        {entry.label}
                        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
                        {active && (
                          <span className="absolute inset-x-3.5 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                        )}
                      </button>
                    </li>
                  )
                }
                const active = isActivePath(pathname, entry.href)
                return (
                  <li key={entry.href} onMouseEnter={closeWithDelay}>
                    <Link
                      href={entry.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative block rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                        active ? "text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {entry.label}
                      {active && (
                        <span className="absolute inset-x-3.5 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-1.5">
              <ThemeToggle className="size-9 border-transparent bg-transparent hover:bg-muted" />
              <Link
                href="/account"
                aria-label="My account"
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-primary",
                  isActivePath(pathname, "/account") && "bg-primary/10 text-primary",
                )}
              >
                <UserRound className="size-[18px]" />
              </Link>
              <Link
                href="/appointments/book"
                className="group ml-1 hidden h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 sm:inline-flex"
              >
                <CalendarPlus className="size-4" />
                Book appointment
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-expanded={mobileOpen}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </nav>

          {activeGroup && (
            <div onMouseEnter={() => openWithHover(activeGroup.label)}>
              <MegaPanel group={activeGroup} pathname={pathname} onNavigate={() => setOpenGroup(null)} />
            </div>
          )}
        </div>
      </div>

      {mobileOpen && <MobileMenu pathname={pathname} onClose={closeMobile} />}
    </header>
  )
}
