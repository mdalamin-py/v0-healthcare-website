"use client"

import { useTransition } from "react"
import { Languages, Loader2 } from "lucide-react"
import { setLocale } from "@/app/actions/locale"
import { useI18n } from "@/components/i18n-provider"
import { localeNames, type Locale } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()
  const next: Locale = locale === "en" ? "bn" : "en"

  return (
    <button
      type="button"
      onClick={() => startTransition(() => setLocale(next))}
      disabled={pending}
      lang={next}
      aria-label={t.header.switchLanguage}
      title={t.header.switchLanguage}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-primary disabled:opacity-60",
        className,
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
      {localeNames[next]}
    </button>
  )
}
