import { stats } from "@/lib/content"
import { cn } from "@/lib/utils"

export function StatsStrip({ className }: { className?: string }) {
  return (
    <section className={cn("border-b border-border bg-card/50", className)}>
      <dl className="container-page grid grid-cols-2 py-10 md:grid-cols-4 md:divide-x md:divide-border">
        {stats.map((stat) => (
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
