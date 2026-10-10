"use client"

import { useEffect } from "react"
import { AlertTriangle, Phone, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="mt-5 text-3xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        We couldn&apos;t load this page right now. Please try again, or call us and our team will help.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} className="rounded-full">
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={site.phone.href}>
            <Phone className="size-4" />
            {site.phone.display}
          </a>
        </Button>
      </div>
    </section>
  )
}
