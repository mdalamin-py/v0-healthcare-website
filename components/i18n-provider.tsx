"use client"

import { createContext, useContext } from "react"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import { en } from "@/lib/i18n/dictionaries/en"

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null)

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dictionary; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>
}

const fallback = { locale: "en" as Locale, t: en }

/** Active language; English outside the public site (e.g. the admin dashboard). */
export function useI18n() {
  return useContext(I18nContext) ?? fallback
}
