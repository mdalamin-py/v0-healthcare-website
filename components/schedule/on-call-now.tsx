import Link from "next/link"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/clinic/format"
import type { OnCallWithDoctor } from "@/lib/clinic/queries"
import { site } from "@/lib/site"

export function currentShift(shifts: OnCallWithDoctor[], now = new Date()) {
  return shifts.find((shift) => new Date(shift.starts_at) <= now && now < new Date(shift.ends_at)) ?? null
}

export function OnCallNow({ shift }: { shift: OnCallWithDoctor | null }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-slate-300 shadow-xl sm:p-8">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
          </span>
          On call now
        </p>
        {shift ? (
          <>
            <Link
              href={`/doctors/${shift.doctor.slug}`}
              className="mt-3 block font-display text-2xl font-bold text-white hover:text-primary"
            >
              {shift.doctor.full_name}
            </Link>
            <p className="text-sm text-primary">{shift.doctor.specialty}</p>
            <p className="mt-3 text-sm">
              Until {formatDateTime(shift.ends_at)}
              {shift.note && ` · ${shift.note}`}
            </p>
          </>
        ) : (
          <p className="mt-3 text-lg font-semibold text-white">Our clinical team is on call 24/7</p>
        )}
        <Button asChild className="mt-6 w-full rounded-full bg-white text-slate-900 hover:bg-white/90">
          <a href={site.phone.href}>
            <Phone className="size-4" />
            Call {site.phone.display}
          </a>
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">For emergencies, always call 911.</p>
      </div>
    </div>
  )
}
