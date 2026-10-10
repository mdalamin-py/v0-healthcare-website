"use client"

import { useTransition } from "react"
import { Check, EyeOff, Loader2 } from "lucide-react"
import { moderateReview } from "@/app/admin/actions"

export function ModerateReviewButtons({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const [pending, startTransition] = useTransition()
  const act = (next: "approved" | "rejected") => startTransition(async () => void (await moderateReview(id, next)))

  return (
    <div className="flex shrink-0 gap-2">
      {status !== "approved" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("approved")}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Publish
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => act("rejected")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <EyeOff className="size-3.5" />
          Hide
        </button>
      )}
    </div>
  )
}
