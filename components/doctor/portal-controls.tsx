"use client"

import { useActionState, useState, useTransition } from "react"
import { CalendarOff, CheckCircle2, Loader2, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addLeave, removeLeave, setAccepting } from "@/app/(site)/doctor-portal/actions"
import { formatDate } from "@/lib/clinic/format"
import type { DoctorLeave } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

function Message({ error, success }: { error?: string; success?: string }) {
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (success)
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm text-accent">
        <CheckCircle2 className="size-4" />
        {success}
      </p>
    )
  return null
}

export function BookingToggle({ accepting }: { accepting: boolean }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: string }>({})

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-2xl border p-5",
          accepting ? "border-accent/40 bg-accent/5" : "border-star/50 bg-star/10",
        )}
      >
        <span className={cn("flex size-12 items-center justify-center rounded-xl", accepting ? "bg-accent/15 text-accent" : "bg-star/20 text-foreground")}>
          {accepting ? <PlayCircle className="size-6" /> : <PauseCircle className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{accepting ? "Accepting new bookings" : "New bookings paused"}</p>
          <p className="text-sm text-muted-foreground">
            {accepting ? "Patients can book your open sessions online." : "Existing serials stay; patients can't book new ones."}
          </p>
        </div>
        <Button
          type="button"
          variant={accepting ? "outline" : "default"}
          disabled={pending}
          onClick={() => startTransition(async () => setResult(await setAccepting(!accepting)))}
          className="w-full rounded-full"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {accepting ? "Pause bookings" : "Resume bookings"}
        </Button>
      </div>
      <Message {...result} />
    </div>
  )
}

export function LeaveManager({ leaves, today }: { leaves: DoctorLeave[]; today: string }) {
  const [state, action, pending] = useActionState(addLeave, {})
  const [removing, startRemoving] = useTransition()
  const [removeResult, setRemoveResult] = useState<{ error?: string; success?: string }>({})

  return (
    <div className="space-y-5">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="leave-date">Date</Label>
          <Input id="leave-date" name="date" type="date" min={today} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leave-reason">Reason (shown publicly)</Label>
          <Input id="leave-reason" name="reason" maxLength={120} placeholder="Conference, personal leave…" />
        </div>
        <Button type="submit" disabled={pending} className="rounded-full sm:col-span-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add day off
        </Button>
      </form>
      <Message {...state} />

      {leaves.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No days off scheduled.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {leaves.map((leave) => (
            <li key={leave.id} className="flex items-center gap-3 px-4 py-3">
              <CalendarOff className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm">
                <span className="font-medium text-foreground">{formatDate(leave.leave_date, { year: "numeric" })}</span>
                {leave.reason && <span className="text-muted-foreground"> · {leave.reason}</span>}
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => startRemoving(async () => setRemoveResult(await removeLeave(leave.id)))}
                aria-label={`Remove day off on ${leave.leave_date}`}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Message {...removeResult} />
    </div>
  )
}
