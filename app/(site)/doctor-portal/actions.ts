"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getDoctorSession } from "@/lib/doctor/session"

type Result = { error?: string; success?: string }

const portalErrors: Record<string, string> = {
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
