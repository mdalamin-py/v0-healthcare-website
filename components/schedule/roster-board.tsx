"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CalendarOff, CheckCircle2, Clock, MinusCircle, PauseCircle } from "lucide-react"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import type { RosterEntry } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const statusMeta = {
  available: { label: "Available", icon: CheckCircle2, className: "bg-accent/15 text-accent" },
  leave: { label: "On leave", icon: CalendarOff, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  off: { label: "Not scheduled", icon: MinusCircle, className: "bg-muted text-muted-foreground" },
} as const

export function RosterBoard({ roster, today }: { roster: RosterEntry[]; today: string }) {
  const dates = useMemo(() => Array.from(new Set(roster.map((entry) => entry.roster_date.slice(0, 10)))), [roster])
  const [selected, setSelected] = useState(dates[0] ?? today)
  const [showAll, setShowAll] = useState(false)

  const entries = roster
    .filter((entry) => entry.roster_date.slice(0, 10) === selected)
    .sort((a, b) => ({ available: 0, leave: 1, off: 2 })[a.status] - ({ available: 0, leave: 1, off: 2 })[b.status])
  const visible = showAll ? entries : entries.filter((entry) => entry.status !== "off")
  const counts = {
    available: entries.filter((entry) => entry.status === "available").length,
    leave: entries.filter((entry) => entry.status === "leave").length,
    off: entries.filter((entry) => entry.status === "off").length,
  }

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]" role="tablist" aria-label="Choose a date">
        {dates.map((date) => {
          const active = date === selected
          const dayEntries = roster.filter((entry) => entry.roster_date.slice(0, 10) === date)
          const available = dayEntries.filter((entry) => entry.status === "available").length
          return (
            <button
              key={date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(date)}
              className={cn(
                "flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-2.5 text-center transition-all",
                active
                  ? "border-transparent bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase", active ? "text-white/80" : "text-muted-foreground")}>
                {date === today ? "Today" : formatDate(date, { weekday: "short", month: undefined, day: undefined })}
              </span>
              <span className="font-display text-xl font-bold">{Number(date.slice(8, 10))}</span>
              <span className={cn("text-[11px]", active ? "text-white/80" : "text-muted-foreground")}>{available} dr</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          {formatDate(selected, { weekday: "long", year: "numeric" })}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(statusMeta) as (keyof typeof statusMeta)[]).map((key) => {
            const meta = statusMeta[key]
            return (
              <span key={key} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium", meta.className)}>
                <meta.icon className="size-3.5" />
                {counts[key]} {meta.label.toLowerCase()}
              </span>
            )
          })}
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {visible.map((entry) => {
          const meta = statusMeta[entry.status]
          return (
            <li
              key={entry.doctor_id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-3">
                <DoctorAvatar name={entry.doctor_name} photoUrl={null} className="size-11 rounded-xl text-sm" />
                <div className="min-w-0">
                  <Link href={`/doctors/${entry.doctor_slug}`} className="font-semibold text-foreground hover:text-primary">
                    {entry.doctor_name}
                  </Link>
                  <p className="text-sm text-primary">{entry.specialty}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", meta.className)}>
                  <meta.icon className="size-3.5" />
                  {meta.label}
                </span>
                {entry.status === "available" &&
                  entry.sessions.map((session) => (
                    <span
                      key={session.start_time}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      <Clock className="size-3" />
                      {formatTimeRange(session.start_time, session.end_time)}
                    </span>
                  ))}
                {entry.status === "leave" && entry.leave_reason && (
                  <span className="text-xs text-muted-foreground">{entry.leave_reason}</span>
                )}
                {entry.status === "available" && !entry.accepting && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <PauseCircle className="size-3.5" />
                    New bookings paused
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {visible.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
          No doctors are in clinic on this day. Our on-call team is available for urgent needs.
        </p>
      )}
      {counts.off > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          {showAll ? "Hide doctors not scheduled" : `Show all doctors (${counts.off} not scheduled)`}
        </button>
      )}
    </div>
  )
}
