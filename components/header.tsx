"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Clock, MapPin, Menu, Phone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { navLinks, site } from "@/lib/site"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

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
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:px-4",
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild className="hidden rounded-full xl:inline-flex">
              <Link href="/contact">Free Consultation</Link>
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
          <div id="mobile-menu" className="animate-in fade-in slide-in-from-top-2 border-t border-border lg:hidden">
            <ul className="container-page flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-4 py-3 font-medium transition-colors",
                      isActive(link.href) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <a href={site.phone.href}>
                    <Phone className="size-4" />
                    Call Us
                  </a>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/contact">Free Consultation</Link>
                </Button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}
