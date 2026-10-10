import Link from "next/link"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { Logo } from "@/components/logo"
import { isGroup, navigation } from "@/lib/navigation"
import { legalLinks, site } from "@/lib/site"

const groups = navigation.filter(isGroup)

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container-page relative grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Providing compassionate, professional home health care to the Fresno community. Your health and dignity are
            our priority.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <a href={site.phone.href} className="flex gap-3 font-semibold text-white transition-colors hover:text-primary">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                {site.phone.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex gap-3 break-all transition-colors hover:text-primary">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.address.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 transition-colors hover:text-primary"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {site.address.street}, {site.address.city}, {site.address.region} {site.address.postalCode}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              {site.hours.office} · {site.hours.onCall}
            </li>
          </ul>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{group.label}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
              {group.label === "About" && (
                <li>
                  <Link href="/contact" className="transition-colors hover:text-primary">
                    Contact
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className="transition-colors hover:text-primary">
                Staff login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
