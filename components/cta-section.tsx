import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fill } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/server"
import { site } from "@/lib/site"

type CtaSectionProps = {
  title: string
  description: string
  linkLabel?: string
}

export async function CtaSection({ title, description, linkLabel }: CtaSectionProps) {
  const t = await getDictionary()

  return (
    <section className="py-16 lg:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent px-6 py-14 text-center text-white shadow-2xl shadow-primary/20 sm:px-12 lg:py-20">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-balance md:text-4xl">{title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/85">{description}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="rounded-full bg-white text-slate-900 hover:bg-white/90">
                <a href={site.phone.href}>
                  <Phone className="size-5" />
                  {fill(t.common.callNumber, { phone: site.phone.display })}
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/contact">
                  {linkLabel ?? t.common.contactOnline}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
