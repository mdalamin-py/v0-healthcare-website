"use server"

import { cookies } from "next/headers"
import { isLocale, localeCookie } from "@/lib/i18n/config"

/** Saves the visitor's language for a year; the current page re-renders in it. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return
  ;(await cookies()).set(localeCookie, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
}
