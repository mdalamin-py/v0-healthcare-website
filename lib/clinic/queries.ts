import "server-only"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"
import type { Doctor, DoctorRating, DoctorReview, DoctorWithSchedules, OnCallShift, QueueSession } from "@/lib/supabase/types"

export type OnCallWithDoctor = OnCallShift & {
  doctor: Pick<Doctor, "full_name" | "slug" | "specialty">
}

// Public pages degrade to a "call us" fallback instead of failing the build or
// the request when the database is unreachable or not migrated yet.
function logError(resource: string, error: { message: string }) {
  console.error(`[clinic] Failed to load ${resource}: ${error.message}`)
}

// Normalizes rows so pages keep working if a newer column is not migrated yet.
function normalizeDoctor(doctor: DoctorWithSchedules): DoctorWithSchedules {
  return {
    ...doctor,
    languages: doctor.languages ?? [],
    visit_types: doctor.visit_types?.length ? doctor.visit_types : ["in_clinic"],
    doctor_schedules: [...(doctor.doctor_schedules ?? [])].sort(
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

  if (error) {
    logError("doctors", error)
    return []
  }
  return (data as DoctorWithSchedules[]).map(normalizeDoctor)
}

export async function getDoctorBySlug(slug: string): Promise<DoctorWithSchedules | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient()
    .from("doctors")
    .select("*, doctor_schedules(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    logError("doctor", error)
    return null
  }
  return data ? normalizeDoctor(data as DoctorWithSchedules) : null
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
  if (error) {
    logError("on-call shifts", error)
    return []
  }
  return data as unknown as OnCallWithDoctor[]
}

export async function getTodayQueue(): Promise<QueueSession[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient().rpc("get_today_queue")
  if (error) {
    logError("queue", error)
    return []
  }
  return data
}

export async function getDoctorRatings(): Promise<Record<string, DoctorRating>> {
  if (!isSupabaseConfigured()) return {}
  const { data, error } = await createPublicClient().rpc("get_doctor_ratings")
  if (error) {
    logError("ratings", error)
    return {}
  }
  return Object.fromEntries(data.map((row) => [row.doctor_id, { average: Number(row.average), total: row.total }]))
}

export async function getDoctorReviews(doctorId: string, limit = 6): Promise<DoctorReview[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from("doctor_reviews")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    logError("reviews", error)
    return []
  }
  return data
}
