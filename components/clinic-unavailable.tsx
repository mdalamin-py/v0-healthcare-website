import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fill } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/server"
import { site } from "@/lib/site"

export async function ClinicUnavailable({ title }: { title: string }) {
  const t = await getDictionary()

  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t.clinic.unavailableText}
      </p>
      <Button asChild className="mt-6 rounded-full">
        <a href={site.phone.href}>
          <Phone className="size-4" />
          {fill(t.common.callNumber, { phone: site.phone.display })}
        </a>
      </Button>
    </div>
  )
}
