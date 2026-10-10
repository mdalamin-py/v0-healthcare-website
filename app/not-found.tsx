import Link from "next/link"
import { ArrowLeft, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n/server"
import SiteLayout from "./(site)/layout"

export default async function NotFound() {
  const t = await getDictionary()

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container-page relative flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <p className="bg-gradient-to-br from-primary to-accent bg-clip-text font-display text-8xl font-extrabold text-transparent">
            404
          </p>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{t.errors.notFoundTitle}</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            {t.errors.notFoundText}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">
                <ArrowLeft className="size-4" />
                {t.errors.backHome}
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/appointments/book">
                <CalendarPlus className="size-4" />
                {t.home.bookCta}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
