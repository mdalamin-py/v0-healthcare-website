import type { Metadata } from "next"
import { ExternalLink, MapPin, MessageSquareHeart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CtaSection } from "@/components/cta-section"
import { PageHero } from "@/components/page-hero"
import { ReviewList } from "@/components/review-list"
import { StatsStrip } from "@/components/stats-strip"
import { getPublishedReviews } from "@/lib/clinic/queries"
import { toReview } from "@/lib/clinic/reviews"
import { getLocale } from "@/lib/i18n/server"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Patient Reviews",
  description: `Read what our patients and their families say about ${site.name}. ${site.rating.value} star rating with ${site.rating.count} reviews in Fresno, CA.`,
}

const googleReviewsUrl = "https://www.google.com/maps/place/1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const [published, locale] = await Promise.all([getPublishedReviews(), getLocale()])
  const reviews = published.filter((review) => review.comment).map((review) => toReview(review, locale))

  return (
    <>
      <PageHero
        eyebrow="Patient Reviews"
        title="What our patients and families say"
        description={
          <p>
            With a {site.rating.value} star rating and {site.rating.count} reviews, families in Fresno trust Dignity
            Home Health Care to provide compassionate, professional care for their loved ones.
          </p>
        }
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
            <span className="font-display text-4xl font-extrabold text-foreground">{site.rating.value}</span>
            <span>
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-4 fill-star text-star" />
                ))}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{site.rating.count} Google reviews</span>
            </span>
          </div>
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-primary/80"
          >
            <MapPin className="size-4" />
            View on Google Maps
            <ExternalLink className="size-4" />
          </a>
        </div>
      </PageHero>

      <StatsStrip />

      {/* Reviews */}
      <section className="py-16 lg:py-24">
        <div className="container-page">
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center text-muted-foreground">
              Verified patient reviews will appear here after their visits. You can also read our reviews on Google.
            </p>
          )}
        </div>
      </section>

      {/* Leave a review */}
      <section className="pb-4">
        <div className="container-page">
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm md:flex-row md:p-10">
            <div className="flex items-start gap-5">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquareHeart className="size-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Are you a current or former patient?</h2>
                <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
                  We would love to hear about your experience. Your feedback helps us improve and helps other families
                  find quality care.
                </p>
              </div>
            </div>
            <Button size="lg" asChild className="shrink-0 rounded-full">
              <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer">
                Leave a Review on Google
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <CtaSection
        title="Experience the care everyone is talking about"
        description={`Join the many families who trust ${site.name}. Contact us today for a free consultation.`}
      />
    </>
  )
}
