import Link from "next/link"
import type { Metadata } from "next"
import { StatusLookup } from "@/components/appointments/status-lookup"
import { PageHero } from "@/components/page-hero"
import { getDictionary } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.statusPage.metaTitle, description: t.statusPage.metaDescription, robots: { index: false } }
}

export default async function AppointmentStatusPage() {
  const p = (await getDictionary()).statusPage

  return (
    <>
      <PageHero
        eyebrow={p.eyebrow}
        title={p.title}
        description={<p>{p.intro}</p>}
      />
      <section className="py-12 lg:py-16">
        <div className="container-page max-w-3xl">
          <StatusLookup />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {p.needNew}{" "}
            <Link href="/appointments/book" className="font-medium text-primary hover:underline">
              {p.bookOnline}
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
