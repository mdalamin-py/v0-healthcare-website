import type { AdminAppointment } from "@/lib/admin/queries"
import type { AppointmentStatus, VisitType } from "@/lib/supabase/types"

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

export function dailyCounts(appointments: AdminAppointment[], from: string, days: number) {
  const counts = new Map<string, number>()
  for (const item of appointments) {
    if (item.status === "cancelled") continue
    counts.set(item.appointment_date, (counts.get(item.appointment_date) ?? 0) + 1)
  }
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(from, index)
    return { date, count: counts.get(date) ?? 0 }
  })
}

export function countBy<K extends string>(appointments: AdminAppointment[], key: (item: AdminAppointment) => K) {
  const counts = new Map<K, number>()
  for (const item of appointments) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1)
  return counts
}

export function statusCounts(appointments: AdminAppointment[]) {
  return countBy<AppointmentStatus>(appointments, (item) => item.status)
}

export function visitTypeCounts(appointments: AdminAppointment[]) {
  return countBy<VisitType>(
    appointments.filter((item) => item.status !== "cancelled"),
    (item) => item.visit_type ?? "in_clinic",
  )
}

export function doctorLoad(appointments: AdminAppointment[]) {
  const counts = countBy(
    appointments.filter((item) => item.status !== "cancelled"),
    (item) => item.doctor?.full_name ?? "Unknown",
  )
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

/** Share of resolved past visits that were completed (not cancelled or left pending). */
export function completionRate(appointments: AdminAppointment[], today: string) {
  const past = appointments.filter((item) => item.appointment_date < today)
  if (past.length === 0) return null
  return Math.round((past.filter((item) => item.status === "completed").length / past.length) * 100)
}
