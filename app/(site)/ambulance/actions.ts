"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { isEmailConfigured, sendAmbulanceAlert } from "@/lib/email"
import { clientIpFrom, createRateLimiter } from "@/lib/rate-limit"
import { site } from "@/lib/site"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"

const limiter = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 })

const requestSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's name").max(100),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "")
      return digits.length >= 10 && digits.length <= 15
    }, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Enter the pickup address").max(300),
  details: z.string().trim().max(500).optional(),
})

export type AmbulanceRequestInput = z.input<typeof requestSchema>

export async function requestAmbulance(input: AmbulanceRequestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const fallback = `Please call us at ${site.phone.display}.`
  if (!isSupabaseConfigured()) return { ok: false, error: `Online requests are unavailable. ${fallback}` }
  if (limiter(clientIpFrom(await headers()))) return { ok: false, error: `Too many requests. ${fallback}` }

  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the details." }

  const { data, error } = await createPublicClient().rpc("request_ambulance", {
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_address: parsed.data.address,
    p_details: parsed.data.details || null,
  })
  if (error) {
    console.error("[ambulance] request failed:", error.message)
    return { ok: false, error: `We couldn't submit the request. ${fallback}` }
  }

  // A repeat from the same phone joins the open request; staff were already alerted.
  if (data?.created && isEmailConfigured()) {
    try {
      await sendAmbulanceAlert(parsed.data)
    } catch (cause) {
      console.error("[ambulance] staff alert failed:", cause)
    }
  }
  return { ok: true }
}
