import { Quote } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import type { Review } from "@/lib/content"

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <StarRating rating={review.rating} />
        <Quote className="size-7 text-primary/15" aria-hidden="true" />
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
        <p>&ldquo;{review.text}&rdquo;</p>
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-white">
          {review.name.charAt(0)}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-foreground">{review.name}</span>
          <span className="block text-xs text-muted-foreground">{review.date}</span>
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{review.service}</span>
      </figcaption>
    </figure>
  )
}
