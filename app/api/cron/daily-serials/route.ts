import { NextResponse, type NextRequest } from "next/server"
import { sendDailySerialDigests } from "@/lib/digest"
import { isResendConfigured } from "@/lib/email"
import { CLINIC_TIME_ZONE } from "@/lib/clinic/format"
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// Vercel Cron calls this at 17:00 and 18:00 UTC; only the run that falls at
// 10 AM clinic time sends, which keeps the schedule correct across DST.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isServiceRoleConfigured() || !isResendConfigured()) {
    return NextResponse.json({ error: "Email or database credentials are not configured." }, { status: 503 })
  }

  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: CLINIC_TIME_ZONE }).format(new Date()))
  const force = request.nextUrl.searchParams.get("force") === "1"
  if (hour !== 10 && !force) {
    return NextResponse.json({ skipped: true, reason: `It is ${hour}:00 in clinic time; digests send at 10:00.` })
  }

  const results = await sendDailySerialDigests(createServiceClient())
  return NextResponse.json({ results })
}
