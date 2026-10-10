"use client"

import { Check, Loader2 } from "lucide-react"
import { useAdminAction } from "@/components/admin/use-admin-action"
import { resolveCallback } from "@/app/admin/actions"

export function ResolveCallbackButton({ id }: { id: string }) {
  const { pending, error, run } = useAdminAction()

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveCallback(id))}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Mark resolved
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
