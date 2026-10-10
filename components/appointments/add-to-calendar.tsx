"use client"

import { CalendarPlus } from "lucide-react"
import { buildAppointmentIcs, type CalendarAppointment } from "@/lib/clinic/ics"
import { cn } from "@/lib/utils"

export function AddToCalendar({ appointment, className }: { appointment: CalendarAppointment; className?: string }) {
  function download() {
    const blob = new Blob([buildAppointmentIcs(appointment)], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `appointment-${appointment.reference}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <button
      type="button"
      onClick={download}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary",
        className,
      )}
    >
      <CalendarPlus className="size-4" />
      Add to calendar
    </button>
  )
}
