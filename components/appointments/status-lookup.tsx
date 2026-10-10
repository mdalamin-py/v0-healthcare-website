"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cancelAppointment, lookupAppointment, type AppointmentLookup } from "@/app/appointments/actions"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import { lookupSchema, type LookupInput } from "@/lib/validations/appointment"
import type { AppointmentStatus } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-star/15 text-foreground",
  confirmed: "bg-accent/15 text-accent",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

export function StatusLookup() {
  const [result, setResult] = useState<AppointmentLookup | null | undefined>(undefined)
  const [lookedUp, setLookedUp] = useState<LookupInput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const form = useForm<LookupInput>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { reference: "", phone: "" },
    mode: "onTouched",
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setConfirmCancel(false)
    const response = await lookupAppointment(values)
    if (response.ok) {
      setResult(response.data)
      setLookedUp(values)
    } else {
      setError(response.error)
    }
  })

  async function onCancel() {
    if (!lookedUp) return
    setCancelling(true)
    setError(null)
    const response = await cancelAppointment(lookedUp)
    setCancelling(false)
    setConfirmCancel(false)
    if (response.ok && result) setResult({ ...result, status: "cancelled" })
    else if (!response.ok) setError(response.error)
  }

  const canCancel = result && (result.status === "pending" || result.status === "confirmed")

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reference">Booking reference</Label>
            <Input
              id="reference"
              placeholder="DHC-1A2B3C4D"
              autoCapitalize="characters"
              className="h-11 font-mono uppercase"
              aria-invalid={errors.reference ? true : undefined}
              {...form.register("reference")}
            />
            {errors.reference && <p className="text-sm text-destructive">{errors.reference.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone used for booking</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="h-11"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-6 h-12 w-full rounded-full">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Find my appointment
        </Button>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {result === null && (
        <p role="status" className="rounded-2xl border border-dashed border-border px-6 py-8 text-center text-muted-foreground">
          We couldn&apos;t find an appointment with those details. Check your reference and phone number.
        </p>
      )}

      {result && (
        <article role="status" className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{result.reference}</p>
              <h2 className="text-xl font-bold text-foreground">{result.doctor_name}</h2>
              <p className="text-sm text-primary">{result.specialty}</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium", statusStyles[result.status])}>
              {statusLabels[result.status]}
            </span>
          </div>
          <dl className="grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Serial number</dt>
              <dd className="font-display text-3xl font-extrabold text-foreground">{result.serial_no}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Date</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatDate(result.appointment_date, { weekday: "long", year: "numeric" })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Session</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatTimeRange(result.start_time, result.end_time)}</dd>
            </div>
          </dl>
          {canCancel && (
            <div className="border-t border-border bg-muted/40 p-6">
              {confirmCancel ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">Cancel this appointment? This can&apos;t be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full" onClick={() => setConfirmCancel(false)}>
                      Keep it
                    </Button>
                    <Button variant="destructive" className="rounded-full" disabled={cancelling} onClick={onCancel}>
                      {cancelling && <Loader2 className="size-4 animate-spin" />}
                      Yes, cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="rounded-full" onClick={() => setConfirmCancel(true)}>
                  <XCircle className="size-4" />
                  Cancel appointment
                </Button>
              )}
            </div>
          )}
        </article>
      )}
    </div>
  )
}
