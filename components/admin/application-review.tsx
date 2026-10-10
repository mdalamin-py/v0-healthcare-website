"use client"

import { useState } from "react"
import { Check, Loader2, X } from "lucide-react"
import { useAdminAction } from "@/components/admin/use-admin-action"
import { reviewDoctorApplication } from "@/app/admin/actions"

export function ApplicationReview({ id, name }: { id: string; name: string }) {
  const { pending, error, run } = useAdminAction()
  const [note, setNote] = useState("")

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={300}
        placeholder="Note to the doctor (optional)"
        aria-label={`Review note for ${name}`}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:w-64"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => reviewDoctorApplication(id, true, note))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => reviewDoctorApplication(id, false, note))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <X className="size-4" />
          Decline
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
