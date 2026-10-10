import type { Metadata } from "next"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactForm } from "@/components/contact-form"
import { FaqSection } from "@/components/faq-section"
import { PageHero } from "@/components/page-hero"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact Us | Dignity Home Health Care",
  description: `Contact ${site.name} in Fresno, CA for a free home health care consultation. Call ${site.phone.display} or send us a message.`,
}

const fullAddress = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`

const contactMethods = [
  {
    icon: Phone,
    title: "Call us",
    content: site.phone.display,
    href: site.phone.href,
    note: "Fastest way to reach a coordinator",
  },
  {
    icon: Mail,
    title: "Email",
    content: site.email,
    href: `mailto:${site.email}`,
    note: "We reply within one business day",
  },
  {
    icon: MapPin,
    title: "Visit",
    content: fullAddress,
    href: site.address.mapsUrl,
    note: "Our Fresno office",
  },
  {
    icon: Clock,
    title: "Hours",
    content: site.hours.office,
    note: site.hours.onCall,
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="Let's talk about your care"
        description={
          <p>
            Have questions about home health care? We are here to help you find the right care for you or your loved
            one. Reach out today for a free, no-obligation consultation.
          </p>
        }
      />

      <section className="py-16 lg:py-24">
        <div className="container-page grid gap-8 lg:grid-cols-12">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
            <h2 className="text-2xl font-bold text-foreground">Send us a message</h2>
            <p className="mt-2 text-muted-foreground">
              Fill out the form and a care coordinator will get back to you within 24 hours.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {contactMethods.map((method) => {
                const body = (
                  <>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <method.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {method.title}
                      </span>
                      <span className="mt-1 block break-words font-semibold text-foreground">{method.content}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{method.note}</span>
                    </span>
                  </>
                )
                const className =
                  "flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors"
                return (
                  <li key={method.title}>
                    {method.href ? (
                      <a
                        href={method.href}
                        target={method.href.startsWith("http") ? "_blank" : undefined}
                        rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`${className} hover:border-primary/40`}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className={className}>{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
              <iframe
                src={mapEmbedUrl}
                title={`Map showing ${site.name} at ${fullAddress}`}
                className="h-72 w-full border-0 dark:opacity-90 dark:[filter:invert(0.9)_hue-rotate(180deg)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg shadow-primary/20">
              <h3 className="text-xl font-bold">Prefer to talk to someone?</h3>
              <p className="mt-2 text-sm text-white/85">
                Our care coordinators can answer your questions and help you get started today.
              </p>
              <Button asChild size="lg" className="mt-5 w-full rounded-full bg-white text-slate-900 hover:bg-white/90">
                <a href={site.phone.href}>
                  <Phone className="size-5" />
                  Call {site.phone.display}
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      <div className="border-t border-border bg-muted/40">
        <FaqSection />
      </div>
    </>
  )
}
