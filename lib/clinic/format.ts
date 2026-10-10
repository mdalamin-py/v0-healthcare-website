import { intlLocale, type Locale } from "@/lib/i18n/config"

export const CLINIC_TIME_ZONE = "America/Los_Angeles"

export const weekdays = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
] as const

/** Display order for weekly views: Monday first. */
export const weekOrder = [1, 2, 3, 4, 5, 6, 0] as const

/** "14:30:00" -> "2:30 PM" */
export function formatTime(time: string, locale: Locale = "en") {
  const [hours, minutes] = time.split(":").map(Number)
  if (locale === "en") {
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`
  }
  return new Intl.DateTimeFormat(intlLocale[locale], { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, hours, minutes)),
  )
}

export function formatTimeRange(start: string, end: string, locale: Locale = "en") {
  return `${formatTime(start, locale)} – ${formatTime(end, locale)}`
}

/** "2026-10-12" -> "Mon, Oct 12" (date-only values, no time zone shift). */
export function formatDate(date: string, options: Intl.DateTimeFormatOptions = {}, locale: Locale = "en") {
  const [year, month, day] = date.split("-").map(Number)
  return new Intl.DateTimeFormat(intlLocale[locale], {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

/** Format an instant in the clinic's time zone. */
export function formatDateTime(value: string, options: Intl.DateTimeFormatOptions = {}, locale: Locale = "en") {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CLINIC_TIME_ZONE,
    ...options,
  }).format(new Date(value))
}

/** Current weekday (0–6) in the clinic's time zone. */
export function clinicWeekday(now = new Date()) {
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: CLINIC_TIME_ZONE }).format(now)
  return weekdays.find((day) => day.short === short)!.value
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(",")[0]
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("")
}

export function formatFee(fee: number | null) {
  if (fee == null) return null
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(fee)
}
