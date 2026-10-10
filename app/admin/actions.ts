"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin/auth"
import { clinicLocalToIso } from "@/lib/admin/time"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import type { AppointmentStatus } from "@/lib/supabase/types"
import { appointmentStatuses, doctorSchema, onCallSchema, scheduleSchema } from "@/lib/validations/admin"

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
    is_active: formData.get("is_active") === "on",
  })
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  if (doctorId) {
    const { error } = await supabase.from("doctors").update(parsed.data).eq("id", doctorId)
    if (error) return { error: dbError(error, "Could not save the doctor.") }
    revalidatePublicPages()
    return { success: "Doctor saved." }
  }

  const { data, error } = await supabase.from("doctors").insert(parsed.data).select("id").single()
  if (error) return { error: dbError(error, "Could not create the doctor.") }
  revalidatePublicPages()
  redirect(`/admin/doctors/${data.id}?created=1`)
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
  if (error) return { error: dbError(error, "Could not remove the session.") }

  revalidatePublicPages()
  return { success: "Session removed." }
}

// ---------------------------------------------------------------------------
// On-call
// ---------------------------------------------------------------------------

export async function addOnCallShift(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin()

  const parsed = onCallSchema.safeParse({
    doctor_id: formData.get("doctor_id"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    note: formData.get("note") ?? "",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid shift.", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("on_call_shifts").insert({
    doctor_id: parsed.data.doctor_id,
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
