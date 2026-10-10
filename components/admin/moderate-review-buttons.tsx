"use client"

import { Check, EyeOff, Loader2 } from "lucide-react"
import { useAdminAction } from "@/components/admin/use-admin-action"
import { moderateReview } from "@/app/admin/actions"

export function ModerateReviewButtons({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const { pending, error, run } = useAdminAction()
  const act = (next: "approved" | "rejected") => run(() => moderateReview(id, next))

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <div className="flex gap-2">
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
