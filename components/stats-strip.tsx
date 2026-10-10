import { getPublicStats } from "@/lib/clinic/queries"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

export async function StatsStrip({ className }: { className?: string }) {
  const stats = await getPublicStats()
  const items = [
    stats?.reviews
      ? { value: stats.rating != null ? Number(stats.rating).toFixed(1) : "–", label: `Patient rating · ${stats.reviews} reviews` }
      : { value: site.rating.value, label: "Google rating" },
    { value: stats ? String(stats.doctors) : "–", label: stats ? `Doctors · ${stats.specialties} specialties` : "Doctors" },
    { value: stats ? stats.completed_visits.toLocaleString("en-US") : "–", label: "Visits completed" },
    { value: "24/7", label: stats ? `On-call · ${stats.ambulances_ready} ambulances ready` : "On-call support" },
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
