"use client"

import { useState, useTransition } from "react"
import { Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitReview } from "@/app/(site)/account/actions"
import { cn } from "@/lib/utils"

const labels = ["Poor", "Fair", "Good", "Very good", "Excellent"]

export function ReviewForm({ appointmentId, onDone }: { appointmentId: string; onDone?: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const shown = hover || rating

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!rating) return setError("Please choose a star rating.")
        setError(null)
        startTransition(async () => {
          const result = await submitReview(appointmentId, rating, comment)
          if (result.ok) onDone?.()
          else setError(result.error)
        })
      }}
      className="mt-4 rounded-2xl border border-border bg-muted/40 p-4"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">How was your visit?</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {labels.map((label, index) => {
            const value = index + 1
            return (
              <label key={label} className="cursor-pointer" onMouseEnter={() => setHover(value)}>
                <input
                  type="radio"
                  name={`rating-${appointmentId}`}
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="peer sr-only"
                  aria-label={`${value} star${value > 1 ? "s" : ""} — ${label}`}
                />
                <Star
                  className={cn(
                    "size-7 transition-colors peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    value <= shown ? "fill-star text-star" : "text-muted-foreground/40",
                  )}
                />
              </label>
            )
          })}
          {shown > 0 && <span className="ml-2 text-sm text-muted-foreground">{labels[shown - 1]}</span>}
        </div>
      </fieldset>
      <label className="mt-3 block">
        <span className="sr-only">Comment</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Share a few words about your experience (optional)"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Only your first name and initial are shown.</p>
        <Button type="submit" size="sm" disabled={pending} className="rounded-full">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Submit review
        </Button>
      </div>
    </form>
  )
}
