"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDoctorSession } from "@/lib/doctor/session"
import { isEmailConfigured, sendDoctorApplicationAlert } from "@/lib/email"
import { doctorApplicationSchema, type DoctorApplicationInput } from "@/lib/validations/doctor-application"

type Result = { error?: string; success?: string }

const portalErrors: Record<string, string> = {
  AUTH_REQUIRED: "Please sign in again.",
  EMAIL_REQUIRED: "Sign in with your email address to register as a doctor.",
  ALREADY_DOCTOR: "This account is already linked to a doctor profile.",
  APPLICATION_PENDING: "Your registration is already under review.",
  NOT_A_DOCTOR: "This account isn't linked to a doctor profile.",
  INVALID_DATE: "Choose today or a future date.",
}

function failure(error: { code?: string; message: string }, fallback: string): Result {
  if (error.code === "23505") return { error: "You are already marked as away on that day." }
  const code = Object.keys(portalErrors).find((key) => error.message.includes(key))
  if (!code) console.error("[doctor-portal]", error.message)
  return { error: code ? portalErrors[code] : fallback }
}

async function session() {
  const { supabase, doctor } = await getDoctorSession()
  return supabase && doctor ? supabase : null
}

export async function setAccepting(accepting: boolean): Promise<Result> {
  const supabase = await session()
  if (!supabase) return { error: portalErrors.NOT_A_DOCTOR }

  const { error } = await supabase.rpc("doctor_set_accepting", { p_accepting: accepting })
  if (error) return failure(error, "Could not update your booking status.")

  revalidatePath("/", "layout")
  return { success: accepting ? "Patients can book with you again." : "New bookings are paused." }
}

const leaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  reason: z.string().trim().max(120, "Keep the reason under 120 characters"),
})

export async function addLeave(_: Result, formData: FormData): Promise<Result> {
  const supabase = await session()
  if (!supabase) return { error: portalErrors.NOT_A_DOCTOR }

  const parsed = leaveSchema.safeParse({ date: formData.get("date"), reason: formData.get("reason") ?? "" })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid date." }

  const { error } = await supabase.rpc("doctor_add_leave", { p_date: parsed.data.date, p_reason: parsed.data.reason || null })
  if (error) return failure(error, "Could not save the day off.")

  revalidatePath("/", "layout")
  return { success: "Day off saved. Patients can't book you that day." }
}

export async function removeLeave(leaveId: string): Promise<Result> {
  const supabase = await session()
  if (!supabase) return { error: portalErrors.NOT_A_DOCTOR }

  const { data, error } = await supabase.rpc("doctor_remove_leave", { p_leave_id: leaveId })
  if (error) return failure(error, "Could not remove the day off.")
  if (!data) return { error: "That day off was already removed." }

  revalidatePath("/", "layout")
  return { success: "Day off removed." }
}

export async function submitApplication(input: DoctorApplicationInput): Promise<Result> {
  const { supabase, user } = await getDoctorSession()
  if (!supabase || !user) return { error: portalErrors.AUTH_REQUIRED }

  const parsed = doctorApplicationSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." }

  const data = parsed.data
  const { error } = await supabase.rpc("submit_doctor_application", {
    p_full_name: data.full_name,
    p_phone: data.phone,
    p_specialty: data.specialty,
    p_qualification: data.qualification,
    p_license_number: data.license_number,
    p_experience_years: data.experience_years,
    p_languages: data.languages,
    p_bio: data.bio || null,
  })
  if (error) return failure(error, "Could not submit your registration.")

  if (isEmailConfigured()) {
    try {
      await sendDoctorApplicationAlert({ ...data, email: user.email ?? "" })
    } catch (cause) {
      // The application is saved; a failed staff alert must not undo it.
      console.error("[doctor-portal] application alert failed:", cause)
    }
  }

  revalidatePath("/doctor-portal")
  return { success: "Registration submitted. We'll email you once the clinic reviews it." }
}
