"use client"

import { useState, useTransition } from "react"
import { Loader2, Moon, Plus, Sun, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormStatus } from "@/components/admin/form-status"
import { useFormAction } from "@/components/admin/use-form-action"
import { addOnCallShift, deleteOnCallShift, type ActionState } from "@/app/admin/actions"
import { formatDateTime } from "@/lib/clinic/format"
import { dutyMeta, dutyTypes } from "@/lib/clinic/duty"
import type { DutyType } from "@/lib/supabase/types"
import type { Doctor, OnCallShift } from "@/lib/supabase/types"

type Shift = OnCallShift & { doctor: Pick<Doctor, "full_name" | "specialty" | "kind"> }

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function OnCallManager({
  doctors,
  shifts,
}: {
  doctors: Pick<Doctor, "id" | "full_name" | "kind">[]
  shifts: Shift[]
}) {
  const { state, pending, form } = useFormAction(addOnCallShift, {})
  const [removeState, setRemoveState] = useState<ActionState>({})
  const [removing, startRemoving] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const now = Date.now()

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <form {...form} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-2 xl:self-start">
        <h2 className="text-lg font-semibold text-foreground">Add a shift</h2>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Doctor
          <select name="doctor_id" required defaultValue="" className={control}>
            <option value="" disabled>
              Choose a doctor
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
                {doctor.kind === "intern" ? " (intern)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Duty type
          <select name="duty_type" defaultValue="on_call" className={control}>
            {(Object.keys(dutyTypes) as DutyType[]).map((type) => (
              <option key={type} value={type}>
                {dutyTypes[type].label} — {dutyTypes[type].description}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Starts (Pacific)
            <input type="datetime-local" name="starts_at" required className={control} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Ends (Pacific)
            <input type="datetime-local" name="ends_at" required className={control} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Note
          <input name="note" maxLength={200} placeholder="e.g. Night shift" className={control} />
        </label>
        <FormStatus state={state} />
        <Button type="submit" disabled={pending} className="w-full rounded-xl">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add shift
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming duties · next 14 days</h2>
        <FormStatus state={removeState} />
        {shifts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No upcoming shifts.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {shifts.map((shift) => {
              const live = new Date(shift.starts_at).getTime() <= now && now < new Date(shift.ends_at).getTime()
              const hour = Number(
                new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Los_Angeles" }).format(
                  new Date(shift.starts_at),
                ),
              )
              const Icon = hour >= 18 || hour < 6 ? Moon : Sun
              const meta = dutyMeta(shift.duty_type)
              return (
                <li key={shift.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Icon className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      {shift.doctor.full_name}
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>{meta.label}</span>
                      {live && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">Live</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateTime(shift.starts_at)} → {formatDateTime(shift.ends_at)}
                      {shift.note && ` · ${shift.note}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => {
                      setRemovingId(shift.id)
                      startRemoving(async () => setRemoveState(await deleteOnCallShift(shift.id)))
                    }}
                    className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    aria-label={`Remove shift for ${shift.doctor.full_name}`}
                  >
                    {removing && removingId === shift.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
