"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Pencil, Send, X } from "lucide-react"
import { AmbulanceForm } from "@/components/admin/ambulance-form"
import { closeAmbulanceRequest, dispatchAmbulance, setAmbulanceStatus } from "@/app/admin/actions"
import { ambulanceStatuses } from "@/lib/clinic/ambulance"
import type { Ambulance, AmbulanceStatus } from "@/lib/supabase/types"

const select =
  "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function AmbulanceStatusControl({ ambulance }: { ambulance: Ambulance }) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <select
          key={ambulance.status}
          aria-label={`Status of ${ambulance.code}`}
          defaultValue={ambulance.status}
          disabled={pending}
          onChange={(event) => {
            const status = event.target.value as AmbulanceStatus
            startTransition(async () => void (await setAmbulanceStatus(ambulance.id, status)))
          }}
          className={select}
        >
          {(Object.keys(ambulanceStatuses) as AmbulanceStatus[]).map((status) => (
            <option key={status} value={status}>
              {ambulanceStatuses[status].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          aria-label={`Edit ${ambulance.code}`}
          className="flex size-9 items-center justify-center rounded-lg border border-border hover:border-primary/40"
        >
          {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
        </button>
      </div>
      {editing && (
        <div className="w-full rounded-xl border border-border bg-muted/30 p-4">
          <AmbulanceForm ambulance={ambulance} onSaved={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}

export function RequestControls({
  requestId,
  status,
  available,
}: {
  requestId: string
  status: "pending" | "dispatched"
  available: Pick<Ambulance, "id" | "code" | "type">[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ambulanceId, setAmbulanceId] = useState(available[0]?.id ?? "")

  const run = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const result = await action()
      setError(result.error ?? null)
    })

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "pending" && (
          <>
            <select
              aria-label="Ambulance to dispatch"
              value={ambulanceId}
              onChange={(event) => setAmbulanceId(event.target.value)}
              disabled={available.length === 0}
              className={select}
            >
              {available.length === 0 && <option value="">No ambulance available</option>}
              {available.map((ambulance) => (
                <option key={ambulance.id} value={ambulance.id}>
                  {ambulance.code} · {ambulance.type.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !ambulanceId}
              onClick={() => run(() => dispatchAmbulance(requestId, ambulanceId))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Dispatch
            </button>
          </>
        )}
        {status === "dispatched" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => closeAmbulanceRequest(requestId, "completed"))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent/15 px-3 text-sm font-semibold text-accent disabled:opacity-50"
          >
            <Check className="size-4" />
            Complete trip
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => closeAmbulanceRequest(requestId, "cancelled"))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <X className="size-4" />
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
