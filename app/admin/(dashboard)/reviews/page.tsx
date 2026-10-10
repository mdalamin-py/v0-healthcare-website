import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ModerateReviewButtons } from "@/components/admin/moderate-review-buttons"
import { StarRating } from "@/components/star-rating"
import { requireAdmin } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/clinic/format"
import type { DoctorReview } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

type Row = DoctorReview & { doctor: { full_name: string } | null }

const tone = {
  pending: "bg-star/15 text-foreground",
  approved: "bg-accent/15 text-accent",
  rejected: "bg-muted text-muted-foreground",
}

export default async function AdminReviewsPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from("doctor_reviews")
    .select("*, doctor:doctors(full_name)")
    .order("status")
    .order("created_at", { ascending: false })
    .limit(200)
  const reviews = (data ?? []) as unknown as Row[]
  const pending = reviews.filter((review) => review.status === "pending").length

  return (
    <>
      <AdminPageHeader title="Patient reviews" description={`${pending} awaiting moderation. Only published reviews appear on the website.`} />
      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No reviews yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-semibold text-foreground">{review.doctor?.full_name}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tone[review.status])}>
                    {review.status}
                  </span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-foreground/90">&ldquo;{review.comment}&rdquo;</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {review.author_name} · {formatDateTime(review.created_at)}
                </p>
              </div>
              <ModerateReviewButtons id={review.id} status={review.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
