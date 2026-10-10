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

/** Translates a known English message (validation or server error); unknown text passes through. */
export function translateMessage(messages: Record<string, string>, message: string | undefined) {
  return message ? (messages[message] ?? message) : message
}

/** Fills `{name}` placeholders in a translated string; numbers use the locale's digits. */
export function fill(template: string, values: Record<string, string | number>, locale: Locale = "en") {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) return match
    const value = values[key]
    return typeof value === "number" ? value.toLocaleString(intlLocale[locale], { useGrouping: false }) : value
  })
}
