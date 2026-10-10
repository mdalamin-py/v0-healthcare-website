import Link from "next/link"
import { Ambulance as AmbulanceIcon, ArrowRight } from "lucide-react"
import { ambulanceStatuses } from "@/lib/clinic/ambulance"
import type { Ambulance, AmbulanceStatus } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export function FleetSummary({ fleet, link = false }: { fleet: Ambulance[]; link?: boolean }) {
  const count = (status: AmbulanceStatus) => fleet.filter((ambulance) => ambulance.status === status).length
  const available = count("available")

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20">
            <AmbulanceIcon className="size-7" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambulances available now</p>
            <p className="font-display text-4xl font-extrabold text-foreground">
              {available}
              <span className="text-lg font-semibold text-muted-foreground"> of {fleet.length}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ambulanceStatuses) as AmbulanceStatus[]).map((status) => (
            <span key={status} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", ambulanceStatuses[status].className)}>
              {count(status)} {ambulanceStatuses[status].label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      {link && (
        <Link href="/ambulance" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          View fleet and request transport
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}
