import type { Locale } from "@/lib/i18n/config"
import { bn } from "@/lib/i18n/dictionaries/bn"
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en"

export type { Dictionary }

export const dictionaries: Record<Locale, Dictionary> = { en, bn }
