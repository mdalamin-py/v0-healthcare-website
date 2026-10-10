"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin/auth"
import { clinicLocalToIso } from "@/lib/clinic/time"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import type { AmbulanceStatus, AppointmentStatus, TheatreStatus } from "@/lib/supabase/types"
import {
  ambulanceSchema,
  appointmentStatuses,
  contactSchema,
  doctorSchema,
  facilitySchema,
  leaveSchema,
  onCallSchema,
  scheduleSchema,
  surgerySchema,
  surgeryUpdateSchema,
  theatreSchema,
} from "@/lib/validations/admin"
import { sendDailySerialDigests, type DigestResult } from "@/lib/digest"
import { isResendConfigured } from "@/lib/email"
import { clinicToday } from "@/lib/clinic/time"

export type ActionState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function revalidatePublicPages() {
  revalidatePath("/", "layout")
}

function dbError(error: { code?: string; message: string }, fallback: string) {
  if (error.code === "23505") return "That value is already in use. Please choose another."
  if (error.code === "23503") return "This item is linked to existing appointments and can't be removed."
  console.error("[admin]", error.message)
  return fallback
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." }

  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { error: "Enter your email and password." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: "Invalid email or password." }

  const { data: isAdmin } = await supabase.rpc("is_admin")
  if (!isAdmin) {
    await supabase.auth.signOut()
    return { error: "This account does not have admin access." }
  }

  redirect("/admin")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  if (!appointmentStatuses.includes(status)) return { error: "Invalid status." }

  // Reopening a cancelled visit must not overfill its session.
  if (status !== "cancelled") {
    const { data: current } = await supabase
      .from("appointments")
      .select("status, schedule_id, appointment_date, schedule:doctor_schedules(max_patients)")
      .eq("id", id)
      .single()
    if (current?.status === "cancelled") {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("schedule_id", current.schedule_id)
        .eq("appointment_date", current.appointment_date)
        .neq("status", "cancelled")
      const capacity = (current.schedule as unknown as { max_patients: number } | null)?.max_patients ?? Infinity
      if ((count ?? 0) >= capacity) return { error: "This session is already full, so the visit can't be reopened." }
    }
  }

  const { error } = await supabase.from("appointments").update({ status }).eq("id", id)
  if (error) return { error: dbError(error, "Could not update the appointment.") }

  revalidatePath("/admin", "layout")
  return { success: "Appointment updated." }
}

// ---------------------------------------------------------------------------
// Doctors & schedules
// ---------------------------------------------------------------------------

export async function saveDoctor(doctorId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()

  const parsed = doctorSchema.safeParse({
    full_name: formData.get("full_name"),
    slug: formData.get("slug"),
    specialty: formData.get("specialty"),
    qualification: formData.get("qualification") ?? "",
    experience_years: formData.get("experience_years") || 0,
    bio: formData.get("bio") ?? "",
    photo_url: formData.get("photo_url") ?? "",
    consultation_fee: formData.get("consultation_fee") ?? "",
    languages: formData.get("languages") ?? "",
    room: formData.get("room") ?? "",
    visit_types: formData.getAll("visit_types"),
    accepting_appointments: formData.get("accepting_appointments") === "on",
    kind: formData.get("kind") ?? "consultant",
    is_active: formData.get("is_active") === "on",
  })
  const contact = contactSchema.safeParse({
    email: formData.get("contact_email") ?? "",
    assistant_name: formData.get("assistant_name") ?? "",
    assistant_email: formData.get("assistant_email") ?? "",
  })
  if (!parsed.success || !contact.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: { ...parsed.error?.flatten().fieldErrors, ...contact.error?.flatten().fieldErrors },
    }
  }

  let id = doctorId
  if (id) {
    const { error } = await supabase.from("doctors").update(parsed.data).eq("id", id)
    if (error) return { error: dbError(error, "Could not save the doctor.") }
  } else {
    const { data, error } = await supabase.from("doctors").insert(parsed.data).select("id").single()
    if (error) return { error: dbError(error, "Could not create the doctor.") }
    id = data.id
  }

  const { error: contactError } = await supabase.from("doctor_contacts").upsert({ doctor_id: id, ...contact.data })
  revalidatePublicPages()
  // A new doctor exists even if the contact save failed, so always move to its page.
  if (!doctorId) redirect(`/admin/doctors/${id}?created=1${contactError ? "&contact=failed" : ""}`)
  if (contactError) return { error: dbError(contactError, "Doctor saved, but contact details could not be saved.") }
  return { success: "Doctor saved." }
}

export async function addSchedule(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()

  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid session.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("doctor_schedules").insert(parsed.data)
  if (error) return { error: dbError(error, "Could not add the session.") }

  revalidatePublicPages()
  return { success: "Session added." }
}

export async function deleteSchedule(scheduleId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("doctor_schedules").delete().eq("id", scheduleId)
  if (error?.code === "23503") {
    // Past bookings reference it: stop offering the session but keep the history.
    const { error: retireError } = await supabase.from("doctor_schedules").update({ is_active: false }).eq("id", scheduleId)
    if (retireError) return { error: dbError(retireError, "Could not remove the session.") }
    revalidatePublicPages()
    return { success: "Session retired. Past bookings are kept." }
  }
  if (error) return { error: dbError(error, "Could not remove the session.") }

  revalidatePublicPages()
  return { success: "Session removed." }
}

export async function addLeave(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = leaveSchema.safeParse({
    doctor_id: formData.get("doctor_id"),
    leave_date: formData.get("leave_date"),
    reason: formData.get("reason") ?? "",
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid date." }
  if (parsed.data.leave_date < clinicToday()) return { error: "Choose today or a future date." }

  const { error } = await supabase.from("doctor_leaves").insert(parsed.data)
  if (error) {
    return { error: error.code === "23505" ? "That day is already marked as leave." : dbError(error, "Could not add the day off.") }
  }

  revalidatePublicPages()
  return { success: "Day off added. Online booking is closed for that date." }
}

export async function removeLeave(leaveId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("doctor_leaves").delete().eq("id", leaveId)
  if (error) return { error: dbError(error, "Could not remove the day off.") }

  revalidatePublicPages()
  return { success: "Day off removed. Booking is open again." }
}

// ---------------------------------------------------------------------------
// On-call
// ---------------------------------------------------------------------------

export async function addOnCallShift(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()

  const parsed = onCallSchema.safeParse({
    doctor_id: formData.get("doctor_id"),
    duty_type: formData.get("duty_type") ?? "on_call",
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    note: formData.get("note") ?? "",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid shift.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("on_call_shifts").insert({
    doctor_id: parsed.data.doctor_id,
    duty_type: parsed.data.duty_type,
    starts_at: clinicLocalToIso(parsed.data.starts_at),
    ends_at: clinicLocalToIso(parsed.data.ends_at),
    note: parsed.data.note,
  })
  if (error) return { error: dbError(error, "Could not add the shift.") }

  revalidatePublicPages()
  return { success: "Shift added." }
}

export async function deleteOnCallShift(shiftId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("on_call_shifts").delete().eq("id", shiftId)
  if (error) return { error: dbError(error, "Could not remove the shift.") }

  revalidatePublicPages()
  return { success: "Shift removed." }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function moderateReview(id: string, status: "approved" | "rejected"): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("doctor_reviews").update({ status }).eq("id", id)
  if (error) return { error: dbError(error, "Could not update the review.") }

  revalidatePath("/", "layout")
  return { success: status === "approved" ? "Review published." : "Review hidden." }
}

// ---------------------------------------------------------------------------
// Ambulances
// ---------------------------------------------------------------------------

const ambulanceErrors: Record<string, string> = {
  AMBULANCE_ON_TRIP: "This ambulance is on an open trip. Complete or cancel the request first.",
  AMBULANCE_UNAVAILABLE: "That ambulance is no longer available.",
  REQUEST_NOT_PENDING: "This request has already been handled.",
  REQUEST_CLOSED: "This request is already closed.",
}

function ambulanceError(error: { message: string; code?: string }, fallback: string) {
  const code = Object.keys(ambulanceErrors).find((key) => error.message.includes(key))
  return code ? ambulanceErrors[code] : dbError(error, fallback)
}

export async function saveAmbulance(ambulanceId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = ambulanceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = ambulanceId
    ? await supabase.from("ambulances").update(parsed.data).eq("id", ambulanceId)
    : await supabase.from("ambulances").insert(parsed.data)
  if (error) return { error: ambulanceError(error, "Could not save the ambulance.") }

  revalidatePath("/", "layout")
  return { success: ambulanceId ? "Ambulance updated." : "Ambulance added." }
}

export async function setAmbulanceStatus(ambulanceId: string, status: AmbulanceStatus): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("ambulances").update({ status }).eq("id", ambulanceId)
  if (error) return { error: ambulanceError(error, "Could not update the status.") }

  revalidatePath("/", "layout")
  return { success: "Status updated." }
}

export async function dispatchAmbulance(requestId: string, ambulanceId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.rpc("dispatch_ambulance", { p_request_id: requestId, p_ambulance_id: ambulanceId })
  if (error) return { error: ambulanceError(error, "Could not dispatch the ambulance.") }

  revalidatePath("/", "layout")
  return { success: "Ambulance dispatched." }
}

export async function closeAmbulanceRequest(requestId: string, status: "completed" | "cancelled"): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.rpc("close_ambulance_request", { p_request_id: requestId, p_status: status })
  if (error) return { error: ambulanceError(error, "Could not close the request.") }

  revalidatePath("/", "layout")
  return { success: status === "completed" ? "Trip completed." : "Request cancelled." }
}

// ---------------------------------------------------------------------------
// Operation theatres
// ---------------------------------------------------------------------------

export async function saveTheatre(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = theatreSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("operation_theatres").insert(parsed.data)
  if (error) return { error: dbError(error, "Could not add the theatre.") }

  revalidatePublicPages()
  return { success: "Theatre added." }
}

export async function setTheatreStatus(theatreId: string, status: TheatreStatus): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("operation_theatres").update({ status }).eq("id", theatreId)
  if (error) return { error: dbError(error, "Could not update the theatre.") }

  revalidatePublicPages()
  return { success: "Theatre updated." }
}

export async function scheduleSurgery(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = surgerySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { data, error } = await supabase
    .from("surgeries")
    .insert({ ...parsed.data, scheduled_at: clinicLocalToIso(parsed.data.scheduled_at) })
    .select("case_code")
    .single()
  if (error) return { error: dbError(error, "Could not schedule the operation.") }

  revalidatePublicPages()
  return { success: `Operation scheduled. Case code ${data.case_code} — share it with the family.` }
}

export async function updateSurgery(surgeryId: string, input: { status: string; note: string }): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = surgeryUpdateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid update." }

  const { error } = await supabase.from("surgeries").update(parsed.data).eq("id", surgeryId)
  if (error?.code === "23505") return { error: "Another operation is already in progress in this theatre." }
  if (error) return { error: dbError(error, "Could not update the operation.") }

  revalidatePublicPages()
  return { success: "Operation updated." }
}

// ---------------------------------------------------------------------------
// Nearby facilities
// ---------------------------------------------------------------------------

export async function saveFacility(facilityId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const parsed = facilitySchema.safeParse({
    ...Object.fromEntries(formData),
    open_24h: formData.get("open_24h") === "on",
    has_emergency: formData.get("has_emergency") === "on",
    is_active: formData.get("is_active") === "on",
  })
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = facilityId
    ? await supabase.from("nearby_facilities").update(parsed.data).eq("id", facilityId)
    : await supabase.from("nearby_facilities").insert(parsed.data)
  if (error) return { error: dbError(error, "Could not save the facility.") }

  revalidatePath("/", "layout")
  return { success: facilityId ? "Facility updated." : "Facility added." }
}

export async function deleteFacility(facilityId: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from("nearby_facilities").delete().eq("id", facilityId)
  if (error) return { error: dbError(error, "Could not remove the facility.") }

  revalidatePath("/", "layout")
  return { success: "Facility removed." }
}

// ---------------------------------------------------------------------------
// Callback requests
// ---------------------------------------------------------------------------

export async function resolveCallback(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: dbError(error, "Could not update the request.") }

  revalidatePath("/admin", "layout")
  return { success: "Marked as resolved." }
}

// ---------------------------------------------------------------------------
// Daily serial lists
// ---------------------------------------------------------------------------

export async function sendSerialListsNow(): Promise<ActionState & { results?: DigestResult[] }> {
  const { supabase } = await requireAdmin()
  if (!isResendConfigured()) return { error: "Email delivery is not configured (RESEND_API_KEY)." }

  const results = await sendDailySerialDigests(supabase)
  const sent = results.filter((result) => result.status === "sent").length
  return { success: `Sent ${sent} of ${results.length} serial lists.`, results }
}

// ---------------------------------------------------------------------------
// Live queue
// ---------------------------------------------------------------------------

export async function callNextPatient(scheduleId: string): Promise<ActionState & { nowServing?: number }> {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.rpc("call_next_patient", { p_schedule_id: scheduleId })
  if (error) return { error: dbError(error, "Could not advance the queue.") }

  revalidatePath("/admin", "layout")
  revalidatePath("/queue")
  return { success: `Now serving #${data}`, nowServing: data }
}
