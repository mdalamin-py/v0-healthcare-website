import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < rating ? "fill-star text-star" : "text-muted-foreground/30")}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
