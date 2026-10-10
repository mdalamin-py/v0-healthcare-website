import "server-only"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"
import type {
  Ambulance,
  Doctor,
  DoctorKind,
  DutyType,
  DoctorLeave,
  DoctorRating,
  PublicStats,
  PublishedReview,
  DoctorWithSchedules,
  NearbyFacility,
  OperationTheatre,
  OtBoardCase,
  OnCallShift,
  QueueSession,
  RosterEntry,
} from "@/lib/supabase/types"

export type OnCallWithDoctor = OnCallShift & {
  doctor: Pick<Doctor, "full_name" | "slug" | "specialty" | "kind">
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
    accepting_appointments: doctor.accepting_appointments ?? true,
    kind: doctor.kind ?? "consultant",
    doctor_schedules: [...(doctor.doctor_schedules ?? [])].filter((schedule) => schedule.is_active !== false).sort(
      (a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start_time.localeCompare(b.start_time),
    ),
  }
}

/** Active doctors of a kind; consultants by default (interns are not bookable). */
export async function getDoctors(kind: DoctorKind = "consultant"): Promise<DoctorWithSchedules[]> {
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
  // Filtered here so pages keep working before the duty-roster migration adds `kind`.
  return (data as DoctorWithSchedules[]).map(normalizeDoctor).filter((doctor) => doctor.kind === kind)
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
  dutyTypes = ["on_call"],
}: { doctorId?: string; days?: number; dutyTypes?: DutyType[] } = {}): Promise<OnCallWithDoctor[]> {
  if (!isSupabaseConfigured()) return []
  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  let query = createPublicClient()
    .from("on_call_shifts")
    .select("*, doctor:doctors!inner(*)")
    .gt("ends_at", now.toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at")

  if (doctorId) query = query.eq("doctor_id", doctorId)

  const { data, error } = await query
  if (error) {
    logError("on-call shifts", error)
    return []
  }
  return (data as unknown as OnCallWithDoctor[]).filter((shift) => dutyTypes.includes(shift.duty_type ?? "on_call"))
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

export async function getDoctorReviews(doctorId: string, limit = 6): Promise<PublishedReview[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from("published_reviews")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    logError("reviews", error)
    return []
  }
  return data
}

export async function getDoctorRoster(days = 14): Promise<RosterEntry[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient().rpc("get_doctor_roster", { p_days: days })
  if (error) {
    logError("roster", error)
    return []
  }
  return data
}

export async function getUpcomingLeaves(doctorId: string): Promise<DoctorLeave[]> {
  if (!isSupabaseConfigured()) return []
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date())
  const { data, error } = await createPublicClient()
    .from("doctor_leaves")
    .select("*")
    .eq("doctor_id", doctorId)
    .gte("leave_date", today)
    .order("leave_date")
    .limit(10)
  if (error) {
    logError("leaves", error)
    return []
  }
  return data
}

export async function getAmbulances(): Promise<Ambulance[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient().from("ambulances").select("*").order("code")
  if (error) {
    logError("ambulances", error)
    return []
  }
  return data
}

export async function getNearbyFacilities(): Promise<NearbyFacility[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient().from("nearby_facilities").select("*").eq("is_active", true).order("name")
  if (error) {
    logError("nearby facilities", error)
    return []
  }
  return data
}

export async function getOtBoard(): Promise<{ theatres: OperationTheatre[]; cases: OtBoardCase[] }> {
  if (!isSupabaseConfigured()) return { theatres: [], cases: [] }
  const client = createPublicClient()
  const [theatres, cases] = await Promise.all([
    client.from("operation_theatres").select("*").order("code"),
    client.rpc("get_ot_board"),
  ])
  if (theatres.error || cases.error) {
    logError("OT board", (theatres.error ?? cases.error)!)
    return { theatres: [], cases: [] }
  }
  return { theatres: theatres.data, cases: cases.data }
}

export async function getPublishedReviews(limit = 60): Promise<PublishedReview[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await createPublicClient()
    .from("published_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) {
    logError("published reviews", error)
    return []
  }
  return data
}

export async function getPublicStats(): Promise<PublicStats | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await createPublicClient().rpc("get_public_stats")
  if (error) {
    logError("public stats", error)
    return null
  }
  return data[0] ?? null
}
