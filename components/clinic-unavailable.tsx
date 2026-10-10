import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export function ClinicUnavailable({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Our online schedule is being updated. Please call us and a care coordinator will help you right away.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <a href={site.phone.href}>
          <Phone className="size-4" />
          Call {site.phone.display}
        </a>
      </Button>
    </div>
  )
}
