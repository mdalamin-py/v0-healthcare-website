"use client"

import { useActionState, useState, useTransition } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormStatus } from "@/components/admin/form-status"
import { addSchedule, deleteSchedule, type ActionState } from "@/app/admin/actions"
import { formatTimeRange, weekdays, weekOrder } from "@/lib/clinic/format"
import type { DoctorSchedule } from "@/lib/supabase/types"

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function ScheduleManager({ doctorId, schedules }: { doctorId: string; schedules: DoctorSchedule[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addSchedule, {})
  const [removeState, setRemoveState] = useState<ActionState>({})
  const [removing, startRemoving] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const sorted = [...schedules].sort(
    (a, b) => weekOrder.indexOf(a.weekday as never) - weekOrder.indexOf(b.weekday as never) || a.start_time.localeCompare(b.start_time),
  )

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Weekly sessions</h2>
        <p className="text-sm text-muted-foreground">Patients can book these sessions online. Times are Pacific Time.</p>
      </div>

      {sorted.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {sorted.map((schedule) => (
            <li key={schedule.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-semibold text-foreground">{weekdays[schedule.weekday].long}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatTimeRange(schedule.start_time, schedule.end_time)} · {schedule.max_patients} patients
                </span>
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => {
                  setRemovingId(schedule.id)
                  startRemoving(async () => setRemoveState(await deleteSchedule(schedule.id)))
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                aria-label={`Remove ${weekdays[schedule.weekday].long} session`}
              >
                {removing && removingId === schedule.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No sessions yet.
        </p>
      )}
      <FormStatus state={removeState} />

      <form action={action} className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <input type="hidden" name="doctor_id" value={doctorId} />
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Day
          <select name="weekday" defaultValue={1} className={control}>
            {weekOrder.map((day) => (
              <option key={day} value={day}>
                {weekdays[day].long}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Start
          <input type="time" name="start_time" defaultValue="09:00" required className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          End
          <input type="time" name="end_time" defaultValue="13:00" required className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Max patients
          <input type="number" name="max_patients" min={1} max={200} defaultValue={20} required className={control} />
        </label>
        <Button type="submit" disabled={pending} className="h-10 rounded-xl">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add session
        </Button>
      </form>
      <FormStatus state={state} />
    </div>
  )
}
