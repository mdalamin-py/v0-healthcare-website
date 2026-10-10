"use client"

import Link from "next/link"
import { useState } from "react"
import { Clock, DoorOpen, Users } from "lucide-react"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { formatTimeRange, weekdays, weekOrder } from "@/lib/clinic/format"
import type { DoctorWithSchedules } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export function DaySchedule({ doctors, today }: { doctors: DoctorWithSchedules[]; today: number }) {
  const [day, setDay] = useState(today)

  const sessions = doctors
    .flatMap((doctor) =>
      doctor.doctor_schedules
        .filter((schedule) => schedule.weekday === day)
        .map((schedule) => ({ doctor, schedule })),
    )
    .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time))

  return (
    <div>
      <div role="tablist" aria-label="Day of week" className="grid grid-cols-7 gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {weekOrder.map((value) => {
          const count = doctors.filter((doctor) => doctor.doctor_schedules.some((s) => s.weekday === value)).length
          const active = value === day
          return (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="day-panel"
              onClick={() => setDay(value)}
              className={cn(
                "flex flex-col items-center rounded-xl px-1 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:bg-muted",
              )}
            >
              <span className="sm:hidden">{weekdays[value].short.slice(0, 2)}</span>
              <span className="hidden sm:inline">{weekdays[value].short}</span>
              <span className={cn("mt-0.5 text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {value === today ? "Today" : `${count} dr`}
              </span>
            </button>
          )
        })}
      </div>

      <div id="day-panel" role="tabpanel" className="mt-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          {weekdays[day].long}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </span>
        </h3>

        {sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map(({ doctor, schedule }) => (
              <li
                key={schedule.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-4">
                  <DoctorAvatar name={doctor.full_name} photoUrl={doctor.photo_url} className="size-12 rounded-xl text-base" />
                  <div className="min-w-0">
                    <Link href={`/doctors/${doctor.slug}`} className="font-semibold text-foreground hover:text-primary">
                      {doctor.full_name}
                    </Link>
                    <p className="text-sm text-primary">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    <Clock className="size-3.5" />
                    {formatTimeRange(schedule.start_time, schedule.end_time)}
                  </span>
                  {doctor.room && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                      <DoorOpen className="size-3.5" />
                      {doctor.room}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    <Users className="size-3.5" />
                    {schedule.max_patients} patients
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
            No doctors are scheduled on {weekdays[day].long}. Our on-call team is available for urgent needs.
          </p>
        )}
      </div>
    </div>
  )
}
