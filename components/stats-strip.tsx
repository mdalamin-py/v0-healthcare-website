import { getPublicStats } from "@/lib/clinic/queries"
import { fill, intlLocale } from "@/lib/i18n/config"
import { getDictionary, getLocale } from "@/lib/i18n/server"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

export async function StatsStrip({ className }: { className?: string }) {
  const [stats, t, locale] = await Promise.all([getPublicStats(), getDictionary(), getLocale()])
  const number = (value: number, digits = 0) =>
    value.toLocaleString(intlLocale[locale], { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const items = [
    stats?.reviews
      ? {
          value: stats.rating != null ? number(Number(stats.rating), 1) : "–",
          label: fill(t.stats.patientRating, { count: number(stats.reviews) }),
        }
      : { value: site.rating.value, label: t.stats.googleRating },
    { value: stats ? number(stats.doctors) : "–", label: stats ? fill(t.stats.doctors, { count: number(stats.specialties) }) : t.stats.doctorsPlain },
    { value: stats ? number(stats.completed_visits) : "–", label: t.stats.visits },
    { value: "24/7", label: stats ? fill(t.stats.onCall, { count: number(stats.ambulances_ready) }) : t.stats.onCallPlain },
  ]

  return (
    <section className={cn("border-b border-border bg-card/50", className)}>
      <dl className="container-page grid grid-cols-2 py-10 md:grid-cols-4 md:divide-x md:divide-border">
        {items.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse px-4 py-3 text-center">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="bg-gradient-to-br from-primary to-accent bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
