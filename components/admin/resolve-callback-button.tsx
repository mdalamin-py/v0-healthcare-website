"use client"

import { useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { resolveCallback } from "@/app/admin/actions"

export function ResolveCallbackButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await resolveCallback(id)))}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      Mark resolved
    </button>
  )
}
