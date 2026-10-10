"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getPatientSession, safeNext } from "@/lib/auth/patient"
import { clientIpFrom, createRateLimiter } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import { site } from "@/lib/site"
import { otpRequestSchema, otpVerifySchema, profileSchema, type OtpChannel, type ProfileInput } from "@/lib/validations/account"

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string }

const otpLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 })
const verifyLimiter = createRateLimiter({ limit: 15, windowMs: 10 * 60_000 })

const NOT_CONFIGURED = "Patient accounts are temporarily unavailable. Please call us to book."

export async function sendOtp(channel: OtpChannel, identifier: string, next?: string): Promise<Result<{ identifier: string }>> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED }
  if (otpLimiter(clientIpFrom(await headers()))) {
    return { ok: false, error: "Too many codes requested. Please wait a few minutes." }
  }

  const parsed = otpRequestSchema.safeParse({ channel, identifier })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." }

  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin") ?? site.url
  const emailRedirectTo = `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(next))}`

  const supabase = await createClient()
  const { error } =
    parsed.data.channel === "email"
      ? await supabase.auth.signInWithOtp({ email: parsed.data.identifier, options: { shouldCreateUser: true, emailRedirectTo } })
      : await supabase.auth.signInWithOtp({ phone: parsed.data.identifier, options: { shouldCreateUser: true } })

  if (error) {
    console.error("[account] OTP request failed:", error.message)
    return {
      ok: false,
      error:
        parsed.data.channel === "phone"
          ? "We couldn't send a text message. Please try email instead."
          : "We couldn't send the code. Please try again.",
    }
  }
  return { ok: true, data: { identifier: parsed.data.identifier } }
}

export async function verifyOtp(
  channel: OtpChannel,
  identifier: string,
  token: string,
  next?: string,
): Promise<Result> {
  if (!isSupabaseConfigured()) return { ok: false, error: NOT_CONFIGURED }
  if (verifyLimiter(clientIpFrom(await headers()))) return { ok: false, error: "Too many attempts. Please wait a few minutes." }

  const parsed = otpVerifySchema.safeParse({ channel, identifier, token })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code." }

  const supabase = await createClient()
  const { error } =
    parsed.data.channel === "email"
      ? await supabase.auth.verifyOtp({ email: parsed.data.identifier, token: parsed.data.token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: parsed.data.identifier, token: parsed.data.token, type: "sms" })

  if (error) return { ok: false, error: "That code is invalid or has expired. Please try again." }

  redirect(safeNext(next))
}

export async function saveProfile(input: ProfileInput, next?: string): Promise<Result> {
  const { supabase, user } = await getPatientSession()
  if (!supabase || !user) return { ok: false, error: "Please sign in again." }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." }

  const { full_name, phone, email, date_of_birth, gender, address } = parsed.data
  const { error } = await supabase.from("patients").upsert({
    user_id: user.id,
    full_name,
    phone,
    email: email || user.email || null,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
    address: address || null,
  })
  if (error) {
    console.error("[account] profile save failed:", error.message)
    return { ok: false, error: "We couldn't save your profile. Please try again." }
  }

  revalidatePath("/account")
  if (next) redirect(safeNext(next))
  return { ok: true, data: null }
}

export async function cancelMyAppointment(appointmentId: string): Promise<Result> {
  const { supabase, user } = await getPatientSession()
  if (!supabase || !user) return { ok: false, error: "Please sign in again." }

  const { data, error } = await supabase.rpc("cancel_my_appointment", { p_appointment_id: appointmentId })
  if (error || !data) return { ok: false, error: "This appointment can no longer be cancelled online." }

  revalidatePath("/account")
  return { ok: true, data: null }
}

export async function signOutPatient() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

const reviewErrors: Record<string, string> = {
  NOT_ELIGIBLE: "You can review a visit once it is completed.",
  ALREADY_REVIEWED: "You've already reviewed this visit.",
  INVALID_RATING: "Please choose a rating from 1 to 5 stars.",
}

export async function submitReview(appointmentId: string, rating: number, comment: string): Promise<Result> {
  const { supabase, user } = await getPatientSession()
  if (!supabase || !user) return { ok: false, error: "Please sign in again." }

  const { error } = await supabase.rpc("submit_review", {
    p_appointment_id: appointmentId,
    p_rating: Math.round(rating),
    p_comment: comment.trim().slice(0, 1000) || null,
  })
  if (error) {
    const code = Object.keys(reviewErrors).find((key) => error.message.includes(key))
    if (!code) console.error("[account] review failed:", error.message)
    return { ok: false, error: code ? reviewErrors[code] : "We couldn't save your review. Please try again." }
  }

  revalidatePath("/account")
  return { ok: true, data: null }
}
