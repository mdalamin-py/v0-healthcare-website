"use client"

import { Star } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { fill } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  const { t, locale } = useI18n()
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={fill(t.clinic.ratingAria, { rating }, locale)}>
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
