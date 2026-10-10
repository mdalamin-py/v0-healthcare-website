import type { Review } from "@/lib/content"
import { intlLocale, type Locale } from "@/lib/i18n/config"
import type { PublishedReview } from "@/lib/supabase/types"

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["week", 7 * 86_400_000],
  ["day", 86_400_000],
]

/** "3 weeks ago" style label for a timestamp. */
export function timeAgo(value: string, locale: Locale = "en", now = Date.now()) {
  const elapsed = now - new Date(value).getTime()
  const format = new Intl.RelativeTimeFormat(intlLocale[locale], { numeric: "auto" })
  for (const [unit, size] of units) {
    if (elapsed >= size) return format.format(-Math.floor(elapsed / size), unit)
  }
  return format.format(0, "day")
}

export function toReview(review: PublishedReview, locale: Locale = "en"): Review {
  return {
    name: review.author_name,
    date: timeAgo(review.created_at, locale),
    rating: review.rating,
    text: review.comment ?? "",
    service: review.doctor_specialty,
    doctor: review.doctor_name,
  }
}
