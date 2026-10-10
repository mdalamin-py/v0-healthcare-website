export const locales = ["en", "bn"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"
export const localeCookie = "lang"

export const localeNames: Record<Locale, string> = { en: "English", bn: "বাংলা" }

/** Intl locale used for dates and numbers. */
export const intlLocale: Record<Locale, string> = { en: "en-US", bn: "bn-BD" }

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

/** Fills `{name}` placeholders in a translated string. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}
