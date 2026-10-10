"use client"

import { useState } from "react"
import { Ambulance as AmbulanceIcon, MapPin, Wrench } from "lucide-react"
import { ambulanceStatuses, ambulanceTypes } from "@/lib/clinic/ambulance"
import type { Ambulance, AmbulanceType } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const ALL = "all"

export function FleetBoard({ fleet }: { fleet: Ambulance[] }) {
  const [type, setType] = useState<AmbulanceType | typeof ALL>(ALL)
  const types = Array.from(new Set(fleet.map((ambulance) => ambulance.type)))
  const visible = (type === ALL ? fleet : fleet.filter((ambulance) => ambulance.type === type)).sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  )

  return (
    <div>
      <div role="group" aria-label="Filter by ambulance type" className="flex flex-wrap gap-2">
        {[ALL, ...types].map((value) => {
          const active = type === value
          const count = value === ALL ? fleet.length : fleet.filter((ambulance) => ambulance.type === value).length
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setType(value as AmbulanceType | typeof ALL)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
              )}
            >
              {value === ALL ? "All types" : ambulanceTypes[value as AmbulanceType].label}
              <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>{count}</span>
            </button>
          )
        })}
      </div>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((ambulance) => {
          const status = ambulanceStatuses[ambulance.status]
          const kind = ambulanceTypes[ambulance.type]
          return (
            <li key={ambulance.id} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20">
                  <AmbulanceIcon className="size-6" />
                </span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                  {ambulance.status === "available" && <span className="size-1.5 rounded-full bg-current" />}
                  {ambulance.status === "maintenance" && <Wrench className="size-3" />}
                  {status.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">{ambulance.code}</h3>
              <p className="text-sm text-muted-foreground">
                {ambulance.vehicle_model} · <span className="font-mono">{ambulance.registration}</span>
              </p>
              <p className="mt-3 text-sm">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {kind.short} · {kind.label}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{kind.description}</p>
              {ambulance.equipment.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Equipment">
                  {ambulance.equipment.map((item) => (
                    <li key={item} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {ambulance.base_location && (
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {ambulance.base_location}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
