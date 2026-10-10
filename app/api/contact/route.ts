import { NextResponse, type NextRequest } from "next/server"
import { contactSchema } from "@/lib/validations/contact"
import { isEmailConfigured, sendContactEmail } from "@/lib/email"
import { site } from "@/lib/site"

const MAX_BODY_BYTES = 10_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

// Best-effort, per-instance rate limiting. Use a shared store (e.g. Upstash Redis)
// if the site needs strict limits across serverless instances.
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function isRateLimited(key: string) {
  const now = Date.now()

  for (const [entryKey, entry] of rateLimits) {
    if (now > entry.resetAt) rateLimits.delete(entryKey)
  }

  const entry = rateLimits.get(key)
  if (!entry) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

function error(message: string, status: number, fieldErrors?: Record<string, string[] | undefined>) {
  return NextResponse.json({ error: message, fieldErrors }, { status })
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return error("Too many requests. Please try again in a minute.", 429)
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error("Request is too large.", 413)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error("Invalid request body.", 400)
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    // A filled honeypot means a bot; respond as if it succeeded.
    if (parsed.error.flatten().fieldErrors.company) {
      return NextResponse.json({ success: true })
    }
    return error("Please correct the highlighted fields.", 400, parsed.error.flatten().fieldErrors)
  }

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact] Email delivery is not configured; submission accepted in development only.")
      return NextResponse.json({ success: true })
    }
    console.error("[contact] RESEND_API_KEY and CONTACT_TO_EMAIL must be set to deliver submissions.")
    return error(`We couldn't send your message right now. Please call us at ${site.phone.display}.`, 503)
  }

  try {
    await sendContactEmail(parsed.data)
  } catch (cause) {
    console.error("[contact] Failed to deliver submission:", cause)
    return error(`We couldn't send your message right now. Please call us at ${site.phone.display}.`, 502)
  }

  return NextResponse.json({ success: true })
}
