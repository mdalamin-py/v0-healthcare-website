import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, CheckCircle, Phone, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CtaSection } from "@/components/cta-section"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { careSteps, insuranceProviders, services } from "@/lib/content"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Comprehensive home health services including skilled nursing, physical therapy, occupational therapy, speech therapy, personal care, and more in Fresno, CA.",
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Comprehensive home health services"
        description={
          <p>
            A full range of healthcare services delivered by skilled professionals in the comfort of your home. Our
            personalized approach keeps you independent while you get the care you need.
          </p>
        }
        image={{ src: "/images/nursing-care.jpg", alt: "Nurse providing skilled care at home" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild className="h-12 rounded-full px-7 shadow-lg shadow-primary/25">
            <Link href="/contact">
              Request Services
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 rounded-full bg-card/70 px-7">
            <a href={site.phone.href}>
              <Phone className="size-5" />
              Call for Free Consultation
            </a>
          </Button>
        </div>
      </PageHero>

      {/* Service quick nav */}
      <nav aria-label="Services" className="border-b border-border bg-card/50">
        <ul className="container-page flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] lg:flex-wrap lg:justify-center lg:overflow-visible">
          {services.map((service) => (
            <li key={service.slug} className="shrink-0">
              <a
                href={`#${service.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
              >
                <service.icon className="size-4 text-primary" />
                {service.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Services grid */}
      <section className="py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="What We Offer"
            title="Care tailored to every need"
            description="Each service is delivered by qualified, compassionate professionals and coordinated with your physicians."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.slug}
                id={service.slug}
                className="group flex scroll-mt-32 flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all target:border-primary target:ring-4 target:ring-primary/15 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/20">
                  <service.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                <ul className="mt-6 space-y-2.5 border-t border-border pt-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How It Works"
            title="Getting started is simple"
            description="From your first call to your first visit, we guide you through every step."
          />
          <div className="relative mt-14">
            <div
              className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-primary/20 via-primary to-accent/20 md:block"
              aria-hidden="true"
            />
            <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {careSteps.map((step, index) => (
                <li key={step.title} className="relative text-center">
                  <span className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white shadow-lg shadow-primary/25 ring-8 ring-background">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="py-16 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Insurance Coverage"
              title="We accept most major insurance plans"
              description="Dignity Home Health Care is certified by Medicare and Medicaid and works with most major insurance providers. We verify your benefits and handle the paperwork so you can focus on your health."
            />
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Not sure if your plan covers home health care? Ask for a free benefits verification — many patients
              qualify for coverage they are not aware of.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Accepted providers</h3>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {insuranceProviders.map((provider) => (
                <li
                  key={provider}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
                >
                  <CheckCircle className="size-4 shrink-0 text-accent" />
                  {provider}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">And many more. Contact us to verify your coverage.</p>
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to start receiving care at home?"
        description="Contact us today for a free consultation. Our care coordinators will help determine the right services for your needs."
        linkLabel="Request Services Online"
      />
    </>
  )
}
