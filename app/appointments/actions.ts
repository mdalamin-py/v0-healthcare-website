"use server"

import { headers } from "next/headers"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"
import { clientIpFrom, createRateLimiter } from "@/lib/rate-limit"
import { bookingSchema, lookupSchema, type BookingInput, type LookupInput } from "@/lib/validations/appointment"
import type { Database } from "@/lib/supabase/types"
import { site } from "@/lib/site"

type Fn = Database["public"]["Functions"]
export type Availability = Fn["get_availability"]["Returns"][number]
export type Booking = Fn["book_appointment"]["Returns"][number]
export type AppointmentLookup = Fn["lookup_appointment"]["Returns"][number]

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const bookingLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 })
const lookupLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 })

const UNAVAILABLE = `Online booking is temporarily unavailable. Please call us at ${site.phone.display}.`

const bookingErrors: Record<string, string> = {
  SESSION_FULL: "This session is fully booked. Please choose another date.",
  DUPLICATE_BOOKING: "This phone number already has a booking for this session.",
  INVALID_DATE: "This date is no longer available. Please choose another date.",
  INVALID_PATIENT: "Please check the patient's name and phone number.",
  SESSION_NOT_FOUND: "This session is no longer offered. Please choose another date.",
}

async function ip() {
  return clientIpFrom(await headers())
}

export async function getAvailability(doctorId: string): Promise<Result<Availability[]>> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNAVAILABLE }
  if (!/^[0-9a-f-]{36}$/i.test(doctorId)) return { ok: false, error: "Unknown doctor." }

  const { data, error } = await createPublicClient().rpc("get_availability", { p_doctor_id: doctorId, p_days: 30 })
  if (error) {
    console.error("[appointments] availability failed:", error.message)
    return { ok: false, error: "We couldn't load available dates. Please try again." }
  }
  return { ok: true, data }
}

export async function bookAppointment(input: BookingInput): Promise<Result<Booking>> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNAVAILABLE }
  if (bookingLimiter(await ip())) {
    return { ok: false, error: "Too many booking attempts. Please wait a few minutes and try again." }
  }

  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted details and try again." }

  const { scheduleId, date, name, phone, email, age, gender, reason } = parsed.data
  const { data, error } = await createPublicClient().rpc("book_appointment", {
    p_schedule_id: scheduleId,
    p_date: date,
    p_name: name,
    p_phone: phone,
    p_email: email || null,
    p_age: age === "" || age === undefined ? null : age,
    p_gender: gender || null,
    p_reason: reason || null,
  })

  if (error) {
    const code = Object.keys(bookingErrors).find((key) => error.message.includes(key))
    if (!code) console.error("[appointments] booking failed:", error.message)
    return { ok: false, error: code ? bookingErrors[code] : "We couldn't complete your booking. Please try again." }
  }

  return { ok: true, data: data[0] }
}

export async function lookupAppointment(input: LookupInput): Promise<Result<AppointmentLookup | null>> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNAVAILABLE }
  if (lookupLimiter(await ip())) return { ok: false, error: "Too many attempts. Please try again later." }

  const parsed = lookupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." }

  const { data, error } = await createPublicClient().rpc("lookup_appointment", {
    p_reference: parsed.data.reference,
    p_phone: parsed.data.phone,
  })
  if (error) {
    console.error("[appointments] lookup failed:", error.message)
    return { ok: false, error: "We couldn't look up your appointment. Please try again." }
  }
  return { ok: true, data: data[0] ?? null }
}

export async function cancelAppointment(input: LookupInput): Promise<Result<boolean>> {
  if (!isSupabaseConfigured()) return { ok: false, error: UNAVAILABLE }
  if (lookupLimiter(await ip())) return { ok: false, error: "Too many attempts. Please try again later." }

  const parsed = lookupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid details." }

  const { data, error } = await createPublicClient().rpc("cancel_appointment", {
    p_reference: parsed.data.reference,
    p_phone: parsed.data.phone,
  })
  if (error) {
    console.error("[appointments] cancel failed:", error.message)
    return { ok: false, error: "We couldn't cancel your appointment. Please call us." }
  }
  return data ? { ok: true, data } : { ok: false, error: "This appointment can no longer be cancelled online." }
}
