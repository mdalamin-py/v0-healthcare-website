"use client"

import { useI18n } from "@/components/i18n-provider"
import { visitTypeMeta } from "@/lib/clinic/visit-types"
import type { VisitType } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export function VisitTypeBadge({ type, className }: { type: VisitType; className?: string }) {
  const { t } = useI18n()
  const meta = visitTypeMeta(type)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground/80",
        className,
      )}
    >
      <meta.icon className="size-3.5 text-primary" />
      {t.clinic.visit[type ?? "in_clinic"]?.label ?? meta.label}
    </span>
  )
}
