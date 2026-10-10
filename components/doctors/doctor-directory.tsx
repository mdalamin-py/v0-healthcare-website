"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { DoctorCard } from "@/components/doctors/doctor-card"
import type { DoctorWithSchedules } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const ALL = "All specialties"

export function DoctorDirectory({ doctors, today }: { doctors: DoctorWithSchedules[]; today: number }) {
  const [query, setQuery] = useState("")
  const [specialty, setSpecialty] = useState(ALL)
  const [todayOnly, setTodayOnly] = useState(false)

  const specialties = useMemo(
    () => [ALL, ...Array.from(new Set(doctors.map((doctor) => doctor.specialty))).sort()],
    [doctors],
  )

  const results = doctors.filter((doctor) => {
    const term = query.trim().toLowerCase()
    const matchesQuery =
      !term || doctor.full_name.toLowerCase().includes(term) || doctor.specialty.toLowerCase().includes(term)
    const matchesSpecialty = specialty === ALL || doctor.specialty === specialty
    const matchesToday = !todayOnly || doctor.doctor_schedules.some((schedule) => schedule.weekday === today)
    return matchesQuery && matchesSpecialty && matchesToday
  })

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search doctors</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or specialty…"
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
        <label className="sr-only" htmlFor="specialty-filter">
          Specialty
        </label>
        <select
          id="specialty-filter"
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-56"
        >
          {specialties.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={todayOnly}
          onClick={() => setTodayOnly((value) => !value)}
          className={cn(
            "h-11 rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            todayOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-foreground/80 hover:border-primary/40",
          )}
        >
          Available today
        </button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        Showing {results.length} of {doctors.length} doctors
      </p>

      {results.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} today={today} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-medium text-foreground">No doctors match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setSpecialty(ALL)
              setTodayOnly(false)
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <X className="size-4" />
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
