"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Menu, X, Heart } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Top bar with phone */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <p className="hidden sm:block">Compassionate Care, Right at Home</p>
          <a 
            href="tel:+15593751234" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity font-medium"
          >
            <Phone className="size-4" />
            <span>(559) 375-1234</span>
          </a>
        </div>
      </div>
      
      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center">
              <Heart className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-foreground leading-tight">Dignity</h1>
              <p className="text-xs text-muted-foreground leading-tight">Home Health Care</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="text-foreground/80 hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button asChild>
              <a href="tel:+15593751234">
                <Phone className="size-4" />
                Call Now
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild className="mt-2">
                <a href="tel:+15593751234">
                  <Phone className="size-4" />
                  Call (559) 375-1234
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
