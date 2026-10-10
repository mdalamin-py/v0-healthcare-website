"use client"

import { useState, useTransition } from "react"
import { BellRing, Loader2 } from "lucide-react"
import { callNextPatient } from "@/app/admin/actions"

export function CallNextButton({
  scheduleId,
  disabled,
  label = "Call next patient",
}: {
  scheduleId: string
  disabled?: boolean
  label?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await callNextPatient(scheduleId)
            setError(result.error ?? null)
          })
        }
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-opacity disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
        {label}
      </button>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
