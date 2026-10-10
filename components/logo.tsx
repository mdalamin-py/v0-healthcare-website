import Link from "next/link"
import { HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
        <HeartPulse className="size-5" />
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-lg font-extrabold tracking-tight", inverted ? "text-white" : "text-foreground")}>
          {site.shortName}
        </span>
        <span className={cn("block text-xs font-medium", inverted ? "text-slate-400" : "text-muted-foreground")}>
          Home Health Care
        </span>
      </span>
    </Link>
  )
}
