"use client"

import { useState, useTransition } from "react"
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormStatus } from "@/components/admin/form-status"
import { useFormAction } from "@/components/admin/use-form-action"
import { addLeave, removeLeave, type ActionState } from "@/app/admin/actions"
import { formatDate } from "@/lib/clinic/format"
import type { DoctorLeave } from "@/lib/supabase/types"

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function LeaveManager({ doctorId, leaves, today }: { doctorId: string; leaves: DoctorLeave[]; today: string }) {
  const { state, pending, form } = useFormAction(addLeave, {})
  const [removeState, setRemoveState] = useState<ActionState>({})
  const [removing, startRemoving] = useTransition()

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <CalendarOff className="size-5 text-red-500" />
          Days off
        </h2>
        <p className="text-sm text-muted-foreground">Online booking closes automatically on these dates.</p>
      </div>

      {leaves.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {leaves.map((leave) => (
            <li key={leave.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-foreground">
                  {formatDate(leave.leave_date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </span>
                {leave.reason && <span className="text-muted-foreground"> · {leave.reason}</span>}
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => startRemoving(async () => setRemoveState(await removeLeave(leave.id)))}
                className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                aria-label="Remove day off"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No upcoming days off.
        </p>
      )}
      <FormStatus state={removeState} />

      <form {...form} className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="doctor_id" value={doctorId} />
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Date
          <input type="date" name="leave_date" min={today} required className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Reason (shown publicly)
          <input name="reason" maxLength={120} placeholder="e.g. Conference" className={control} />
        </label>
        <Button type="submit" disabled={pending} className="h-10 rounded-xl">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add day off
        </Button>
      </form>
      <FormStatus state={state} />
    </div>
  )
}
