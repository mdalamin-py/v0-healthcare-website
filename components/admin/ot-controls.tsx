"use client"

import { useState } from "react"
import { ArrowRight, CalendarPlus, Loader2, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldMessage, FormStatus } from "@/components/admin/form-status"
import { useAdminAction } from "@/components/admin/use-admin-action"
import { useFormAction } from "@/components/admin/use-form-action"
import { saveTheatre, scheduleSurgery, setTheatreStatus, updateSurgery } from "@/app/admin/actions"
import { nextSurgeryStatus, surgeryStatuses, theatreStatuses } from "@/lib/clinic/ot"
import type { Doctor, OperationTheatre, SurgeryStatus, TheatreStatus } from "@/lib/supabase/types"

const select =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

// ---------------------------------------------------------------------------
// Theatres
// ---------------------------------------------------------------------------

export function TheatreStatusControl({ theatre }: { theatre: OperationTheatre }) {
  const { pending, error, run } = useAdminAction()
  const [attempt, setAttempt] = useState(0)

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex w-full items-center gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      <select
        key={`${theatre.status}-${attempt}`}
        aria-label={`Status of ${theatre.code}`}
        defaultValue={theatre.status}
        disabled={pending}
        onChange={(event) => {
          const status = event.target.value as TheatreStatus
          run(() => setTheatreStatus(theatre.id, status), () => setAttempt((value) => value + 1))
        }}
        className={select}
      >
        {(Object.keys(theatreStatuses) as TheatreStatus[]).map((status) => (
          <option key={status} value={status}>
            {theatreStatuses[status].label}
          </option>
        ))}
      </select>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function AddTheatreForm() {
  const { state, pending, form } = useFormAction(saveTheatre)
  const errors = state.fieldErrors ?? {}

  return (
    <form {...form} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr_1fr_10rem]">
        <div className="space-y-1.5">
          <Label htmlFor="theatre-code">Code</Label>
          <Input id="theatre-code" name="code" placeholder="OT-4" required />
          <FieldMessage messages={errors.code} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="theatre-name">Name</Label>
          <Input id="theatre-name" name="name" required />
          <FieldMessage messages={errors.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="theatre-location">Location</Label>
          <Input id="theatre-location" name="location" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="theatre-status">Status</Label>
          <select id="theatre-status" name="status" defaultValue="available" className={select}>
            {(Object.keys(theatreStatuses) as TheatreStatus[]).map((status) => (
              <option key={status} value={status}>
                {theatreStatuses[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FormStatus state={state} />
      <Button type="submit" variant="outline" disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add theatre
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export function ScheduleSurgeryForm({
  theatres,
  surgeons,
}: {
  theatres: Pick<OperationTheatre, "id" | "code" | "name">[]
  surgeons: Pick<Doctor, "id" | "full_name" | "specialty">[]
}) {
  const { state, pending, form } = useFormAction(scheduleSurgery)
  const errors = state.fieldErrors ?? {}

  return (
    <form {...form} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="surgery-procedure">Procedure</Label>
          <Input id="surgery-procedure" name="procedure" required />
          <FieldMessage messages={errors.procedure} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surgery-patient">Patient name (staff only)</Label>
          <Input id="surgery-patient" name="patient_name" required />
          <FieldMessage messages={errors.patient_name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surgery-theatre">Theatre</Label>
          <select id="surgery-theatre" name="theatre_id" required className={select}>
            {theatres.map((theatre) => (
              <option key={theatre.id} value={theatre.id}>
                {theatre.code} · {theatre.name}
              </option>
            ))}
          </select>
          <FieldMessage messages={errors.theatre_id} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surgery-surgeon">Surgeon</Label>
          <select id="surgery-surgeon" name="surgeon_id" required className={select}>
            {surgeons.map((surgeon) => (
              <option key={surgeon.id} value={surgeon.id}>
                {surgeon.full_name} · {surgeon.specialty}
              </option>
            ))}
          </select>
          <FieldMessage messages={errors.surgeon_id} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surgery-start">Start</Label>
          <Input id="surgery-start" name="scheduled_at" type="datetime-local" required />
          <FieldMessage messages={errors.scheduled_at} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surgery-duration">Expected duration (minutes)</Label>
          <Input id="surgery-duration" name="duration_minutes" type="number" min={15} max={720} step={5} defaultValue={60} required />
          <FieldMessage messages={errors.duration_minutes} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="surgery-note">Public note (optional)</Label>
          <Input id="surgery-note" name="note" placeholder="Shown on the public board" />
        </div>
      </div>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
        Schedule operation
      </Button>
    </form>
  )
}

export function SurgeryControls({ id, status, note }: { id: string; status: SurgeryStatus; note: string | null }) {
  const { pending, error, run } = useAdminAction()
  const [nextStatus, setNextStatus] = useState<SurgeryStatus>(status)
  const [nextNote, setNextNote] = useState(note ?? "")
  const [synced, setSynced] = useState({ status, note })
  // Re-sync the drafts when the server sends a newer status or note.
  if (synced.status !== status || synced.note !== note) {
    setSynced({ status, note })
    setNextStatus(status)
    setNextNote(note ?? "")
  }
  const advance = nextSurgeryStatus[status]

  const save = (input: { status: SurgeryStatus; note: string }) => run(() => updateSurgery(id, input))

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {advance && (
          <button
            type="button"
            disabled={pending}
            onClick={() => save({ status: advance, note: nextNote })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {surgeryStatuses[advance].label}
          </button>
        )}
        <select
          aria-label="Status"
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as SurgeryStatus)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        >
          {(Object.keys(surgeryStatuses) as SurgeryStatus[]).map((value) => (
            <option key={value} value={value}>
              {surgeryStatuses[value].label}
            </option>
          ))}
        </select>
        <Input
          aria-label="Public note"
          value={nextNote}
          onChange={(event) => setNextNote(event.target.value)}
          placeholder="Public note"
          className="h-9 w-44"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => save({ status: nextStatus, note: nextNote })}
          aria-label="Save status and note"
          className="flex size-9 items-center justify-center rounded-lg border border-border hover:border-primary/40 disabled:opacity-50"
        >
          <Save className="size-4" />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
