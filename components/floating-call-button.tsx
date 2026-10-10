import { Phone } from "lucide-react"
import { site } from "@/lib/site"

export function FloatingCallButton() {
  return (
    <a
      href={site.phone.href}
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-4 font-semibold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 sm:px-5 sm:py-3"
      aria-label={`Call us at ${site.phone.display}`}
    >
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40" />
        <Phone className="relative size-5" />
      </span>
      <span className="hidden sm:inline">Call Now</span>
    </a>
  )
}
