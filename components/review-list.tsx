"use client"

import { useMemo, useState } from "react"
import { ReviewCard } from "@/components/review-card"
import type { Review } from "@/lib/content"
import { cn } from "@/lib/utils"

const ALL = "All"

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState(ALL)

  const categories = useMemo(() => [ALL, ...Array.from(new Set(reviews.map((review) => review.service)))], [reviews])
  const visible = filter === ALL ? reviews : reviews.filter((review) => review.service === filter)

  return (
    <>
      <div role="group" aria-label="Filter reviews by service" className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => {
          const count = category === ALL ? reviews.length : reviews.filter((r) => r.service === category).length
          const active = filter === category
          return (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary",
              )}
            >
              {category}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-white/20" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "review" : "reviews"}
      </p>

      <div className="mt-10 columns-1 gap-6 md:columns-2 lg:columns-3">
        {visible.map((review) => (
          <div key={review.name} className="mb-6 break-inside-avoid animate-in fade-in duration-300">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </>
  )
}
