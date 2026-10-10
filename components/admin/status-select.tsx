"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { updateAppointmentStatus } from "@/app/admin/actions"
import type { AppointmentStatus } from "@/lib/supabase/types"
import { appointmentStatuses } from "@/lib/validations/admin"
import { cn } from "@/lib/utils"

export const statusTone: Record<AppointmentStatus, string> = {
  pending: "border-star/40 bg-star/10 text-foreground",
  confirmed: "border-accent/40 bg-accent/10 text-accent",
  completed: "border-primary/40 bg-primary/10 text-primary",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
}

export function StatusSelect({ id, status, label }: { id: string; status: AppointmentStatus; label: string }) {
  const [value, setValue] = useState(status)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label={`Status for ${label}`}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as AppointmentStatus
          const previous = value
          setValue(next)
          setError(null)
          startTransition(async () => {
            const result = await updateAppointmentStatus(id, next)
            if (result.error) {
              setValue(previous)
              setError(result.error)
            }
          })
        }}
        className={cn(
          "h-9 rounded-full border px-3 text-sm font-medium capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          statusTone[value],
        )}
      >
        {appointmentStatuses.map((item) => (
          <option key={item} value={item} className="bg-background text-foreground">
            {item}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
