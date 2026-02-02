"use client"

import { Phone } from "lucide-react"

export function FloatingCallButton() {
  return (
    <a
      href="tel:+15593751234"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105 font-medium"
      aria-label="Call us now"
    >
      <Phone className="size-5 animate-pulse" />
      <span className="hidden sm:inline">Call Now</span>
    </a>
  )
}
