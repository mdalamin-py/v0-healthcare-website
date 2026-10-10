import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { defaultLocale, isLocale, localeCookie, type Locale } from "@/lib/i18n/config"
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries"

/** The visitor's chosen language, from the `lang` cookie. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(localeCookie)?.value
  return isLocale(value) ? value : defaultLocale
})

export const getDictionary = cache(async (): Promise<Dictionary> => dictionaries[await getLocale()])
