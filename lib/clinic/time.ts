import { CLINIC_TIME_ZONE } from "@/lib/clinic/format"

function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  )
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return asUtc - instant.getTime()
}

/** Converts a "YYYY-MM-DDTHH:mm" wall-clock time in the clinic time zone to an ISO instant. */
export function clinicLocalToIso(local: string) {
  const [date, time] = local.split("T")
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const wallClock = Date.UTC(year, month - 1, day, hour, minute)

  let instant = wallClock - zoneOffsetMs(new Date(wallClock), CLINIC_TIME_ZONE)
  // Re-check once to settle DST transitions.
  instant = wallClock - zoneOffsetMs(new Date(instant), CLINIC_TIME_ZONE)
  return new Date(instant).toISOString()
}

/** Today's date (YYYY-MM-DD) in the clinic time zone. */
export function clinicToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIME_ZONE }).format(now)
}
