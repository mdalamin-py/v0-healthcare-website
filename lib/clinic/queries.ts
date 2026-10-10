import "server-only"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"
import type { Doctor, DoctorWithSchedules, OnCallShift } from "@/lib/supabase/types"

export type OnCallWithDoctor = OnCallShift & {
  doctor: Pick<Doctor, "full_name" | "slug" | "specialty">
}

function sortSchedules(doctor: DoctorWithSchedules): DoctorWithSchedules {
  return {
    ...doctor,
    doctor_schedules: [...doctor.doctor_schedules].sort(
      (a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start_time.localeCompare(b.start_time),
    ),
  }
}

export async function getDoctors(): Promise<DoctorWithSchedules[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .eq("is_active", true)
    .order("full_name")

  if (error) throw new Error(`Failed to load doctors: ${error.message}`)
  return (data as DoctorWithSchedules[]).map(sortSchedules)
}

export async function getDoctorBySlug(slug: string): Promise<DoctorWithSchedules | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient()
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (error) throw new Error(`Failed to load doctor: ${error.message}`)
  return data ? sortSchedules(data as DoctorWithSchedules) : null
}

export async function getOnCallShifts({
  doctorId,
  days = 7,
}: { doctorId?: string; days?: number } = {}): Promise<OnCallWithDoctor[]> {
  if (!isSupabaseConfigured()) return []
  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  let query = createPublicClient()
    .from("on_call_shifts")
    .select("*, doctor:doctors!inner(full_name, slug, specialty)")
    .gt("ends_at", now.toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at")

  if (doctorId) query = query.eq("doctor_id", doctorId)

  const { data, error } = await query
  if (error) throw new Error(`Failed to load on-call shifts: ${error.message}`)
  return data as unknown as OnCallWithDoctor[]
}
