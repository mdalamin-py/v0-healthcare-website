"use client"

import { useState, useTransition } from "react"
import { Loader2, Pencil, Trash2, X } from "lucide-react"
import { FacilityForm } from "@/components/admin/facility-form"
import { deleteFacility } from "@/app/admin/actions"
import type { NearbyFacility } from "@/lib/supabase/types"

export function FacilityControls({ facility }: { facility: NearbyFacility }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const remove = () =>
    startTransition(async () => {
      const result = await deleteFacility(facility.id)
      setError(result.error ?? null)
      setConfirming(false)
    })

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-sm text-muted-foreground">Remove?</span>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Remove
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="h-9 rounded-lg border border-border px-3 text-sm">
              Keep
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              aria-label={`Edit ${facility.name}`}
              className="flex size-9 items-center justify-center rounded-lg border border-border hover:border-primary/40"
            >
              {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${facility.name}`}
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {editing && (
        <div className="w-full rounded-xl border border-border bg-muted/30 p-4">
          <FacilityForm facility={facility} onSaved={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}
