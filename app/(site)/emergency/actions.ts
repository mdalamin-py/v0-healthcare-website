"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { isEmailConfigured, sendCallbackAlert } from "@/lib/email"
import { clientIpFrom, createRateLimiter } from "@/lib/rate-limit"
import { site } from "@/lib/site"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public"

const limiter = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 })

const callbackSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "")
      return digits.length >= 10 && digits.length <= 15
    }, "Enter a valid phone number"),
  concern: z.string().trim().min(5, "Briefly describe the concern").max(500),
})

export type CallbackInput = z.input<typeof callbackSchema>

export async function requestCallback(input: CallbackInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const fallback = `Please call us directly at ${site.phone.display}.`
  if (!isSupabaseConfigured()) return { ok: false, error: `Online requests are unavailable. ${fallback}` }
  if (limiter(clientIpFrom(await headers()))) return { ok: false, error: `Too many requests. ${fallback}` }

  const parsed = callbackSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." }

  const { data, error } = await createPublicClient().rpc("request_callback", {
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_concern: parsed.data.concern,
  })
  if (error) {
    console.error("[emergency] callback request failed:", error.message)
    return { ok: false, error: `We couldn't submit your request. ${fallback}` }
  }

  // A repeat from the same phone joins the open request; staff were already alerted.
  if (data?.created && isEmailConfigured()) {
    try {
      await sendCallbackAlert(parsed.data)
    } catch (cause) {
      console.error("[emergency] staff alert failed:", cause)
    }
  }
  return { ok: true }
}
