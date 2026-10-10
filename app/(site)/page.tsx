import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CheckCircle, HeartPulse, Phone, ShieldCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CtaSection } from "@/components/cta-section"
import { FaqSection } from "@/components/faq-section"
import { ReviewCard } from "@/components/review-card"
import { SectionHeading } from "@/components/section-heading"
import { StatsStrip } from "@/components/stats-strip"
import { currentShift } from "@/components/schedule/on-call-now"
import { getOnCallShifts } from "@/lib/clinic/queries"
import { reviews, services, trustBadges, whyChooseUs } from "@/lib/content"
import { site } from "@/lib/site"

const featuredServices = services.slice(0, 5)
const featuredReviews = reviews.slice(0, 3)

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const onCall = currentShift(await getOnCallShifts({ days: 1 }))

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 -top-32 size-[480px] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-40 size-[420px] rounded-full bg-accent/20 blur-3xl" />

        <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-4 text-sm shadow-sm backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                <Star className="size-3 fill-current" />
                {site.rating.value}
              </span>
              <span className="text-muted-foreground">Rated by {site.rating.count} families on Google</span>
            </Link>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] text-foreground text-balance sm:text-5xl lg:text-6xl">
              Compassionate care,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                right at home
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Professional, personalized home health care for Fresno and the Central Valley — care that
              preserves your independence and your dignity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-full px-7 shadow-lg shadow-primary/25">
                <Link href="/appointments/book">
                  Book an Appointment
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 rounded-full bg-card/70 px-7">
                <a href={site.phone.href}>
                  <Phone className="size-5" />
                  {site.phone.display}
                </a>
              </Button>
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-x-6">
              {trustBadges.map((badge) => (
                <li key={badge.label} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <badge.icon className="size-4 text-primary" />
                  {badge.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/40 shadow-2xl">
              <Image
                src="/images/hero-care.jpg"
                alt="Caring nurse with an elderly patient at home"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:-left-6">
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <HeartPulse className="size-6" />
              </span>
              <span>
                <span className="block text-2xl font-bold text-foreground">{site.rating.count}</span>
                <span className="block text-sm text-muted-foreground">Happy families</span>
              </span>
            </div>

            <div className="absolute -top-5 right-4 hidden items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-xl backdrop-blur sm:flex lg:-right-4">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
              </span>
              {onCall ? (
                <Link href="/schedule" className="text-sm font-medium text-foreground hover:text-primary">
                  On call now: {onCall.doctor.full_name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">{site.hours.onCall}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <StatsStrip className="border-t" />

      {/* Services */}
      <section className="py-16 lg:py-24">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              align="left"
              eyebrow="Our Services"
              title="Complete care, delivered to your door"
              description="A full range of home health services designed around your needs — so you can recover and thrive in the comfort of home."
            />
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/services">
                All {services.length} services
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services#${service.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <service.icon className="size-6" />
                  </span>
                  <ArrowUpRight className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
              </Link>
            ))}
            <Link
              href="/contact"
              className="group flex flex-col justify-between rounded-2xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-1"
            >
              <ShieldCheck className="size-8" />
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Not sure what you need?</h3>
                <p className="mt-2 text-sm text-white/85">
                  Get a free in-home assessment and a personalized care plan.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                  Request assessment
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-xl">
              <Image
                src="/images/team-care.jpg"
                alt="The Dignity Home Health Care team"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 rounded-2xl border border-border bg-card p-5 shadow-xl sm:right-6">
              <p className="text-sm text-muted-foreground">Languages spoken</p>
              <p className="mt-1 font-semibold text-foreground">English &amp; Spanish</p>
            </div>
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Dignity"
              title="Why families choose Dignity Home Health Care"
              description="Our commitment to quality care and patient dignity sets us apart in the Fresno community."
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {whyChooseUs.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 rounded-full">
              <Link href="/about">
                Learn more about us
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Testimonials"
            title="What families say about us"
            description="Our patients and their families trust us to provide compassionate, professional care."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredReviews.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/reviews">
                Read all reviews
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <FaqSection />

      <CtaSection
        title="Ready to get started?"
        description="Contact us today for a free consultation. Our care coordinators will help create a personalized care plan for you or your loved one."
      />
    </>
  )
}
