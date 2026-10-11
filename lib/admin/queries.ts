import "server-only"
import { requireAdmin } from "@/lib/admin/auth"
import { clinicLocalToIso, clinicToday } from "@/lib/clinic/time"
import type { Appointment, AppointmentStatus, Doctor, DoctorSchedule, OnCallShift, OperationTheatre, Surgery } from "@/lib/supabase/types"

export type AdminAppointment = Appointment & {
  doctor: Pick<Doctor, "full_name" | "specialty"> | null
  schedule: Pick<DoctorSchedule, "start_time" | "end_time"> | null
}

export type AppointmentFilters = {
  date?: string
  from?: string
  to?: string
  doctorId?: string
  status?: AppointmentStatus
  search?: string
  limit?: number
}

/** Strips characters that have meaning in PostgREST filter syntax. */
function sanitizeSearch(value: string) {
  return value.replace(/[,()%*\\]/g, " ").trim().slice(0, 60)
}

const PAGE_SIZE = 1000
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function listAppointments(filters: AppointmentFilters): Promise<AdminAppointment[]> {
  const { supabase } = await requireAdmin()
  const limit = filters.limit ?? 5000
  const term = filters.search ? sanitizeSearch(filters.search) : ""
  const rows: AdminAppointment[] = []

  // PostgREST caps each response, so read in pages until the limit or the end.
  for (let offset = 0; offset < limit; offset += PAGE_SIZE) {
    let query = supabase
      .from("appointments")
      .select("*, doctor:doctors(full_name, specialty), schedule:doctor_schedules(start_time, end_time)")
      .order("appointment_date")
      .order("reporting_time")
      .order("serial_no")
      .order("id")
      .range(offset, Math.min(offset + PAGE_SIZE, limit) - 1)

    if (filters.date) query = query.eq("appointment_date", filters.date)
    if (filters.from) query = query.gte("appointment_date", filters.from)
    if (filters.to) query = query.lte("appointment_date", filters.to)
    if (filters.doctorId && isUuid(filters.doctorId)) query = query.eq("doctor_id", filters.doctorId)
    if (filters.status) query = query.eq("status", filters.status)
    if (term) query = query.or(`patient_name.ilike.%${term}%,patient_phone.ilike.%${term}%,reference.ilike.%${term}%`)

    const { data, error } = await query
    if (error) throw new Error(`Failed to load appointments: ${error.message}`)
    rows.push(...(data as unknown as AdminAppointment[]))
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

export async function listAllDoctors() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from("doctors").select("*, doctor_schedules(*)").order("full_name")
  if (error) throw new Error(`Failed to load doctors: ${error.message}`)
  return data as (Doctor & { doctor_schedules: DoctorSchedule[] })[]
}

export async function getDoctorForAdmin(id: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from("doctors").select("*, doctor_schedules(*)").eq("id", id).maybeSingle()
  if (error) throw new Error(`Failed to load doctor: ${error.message}`)
  return data as (Doctor & { doctor_schedules: DoctorSchedule[] }) | null
}

export async function listUpcomingShifts(days = 14) {
  const { supabase } = await requireAdmin()
  const now = new Date()
  const until = new Date(now.getTime() + days * 86_400_000)
  const { data, error } = await supabase
    .from("on_call_shifts")
    .select("*, doctor:doctors(*)")
    .gt("ends_at", now.toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at")
  if (error) throw new Error(`Failed to load shifts: ${error.message}`)
  return data as unknown as (OnCallShift & { doctor: Pick<Doctor, "full_name" | "slug" | "specialty" | "kind"> })[]
}

export type AdminSurgery = Surgery & {
  theatre: Pick<OperationTheatre, "code" | "name">
  surgeon: Pick<Doctor, "full_name" | "specialty">
}

/** Operations from the start of today (clinic time) for the next `days` days. */
export async function listSurgeries(days = 7) {
  const { supabase } = await requireAdmin()
  const from = clinicLocalToIso(`${clinicToday()}T00:00`)
  const until = new Date(new Date(from).getTime() + days * 86_400_000).toISOString()
  const { data, error } = await supabase
    .from("surgeries")
    .select("*, theatre:operation_theatres(code, name), surgeon:doctors(full_name, specialty)")
    .gte("scheduled_at", from)
    .lt("scheduled_at", until)
    .order("scheduled_at")
  if (error) throw new Error(`Failed to load operations: ${error.message}`)
  return data as unknown as AdminSurgery[]
}

export async function listRecentPatients(since: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from("patients").select("user_id, created_at").gte("created_at", since).limit(1000)
  if (error) {
    console.error("[admin] Failed to load patients:", error.message)
    return []
  }
  return data
}
