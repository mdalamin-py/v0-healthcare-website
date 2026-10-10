import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { safeNext } from "@/lib/auth/patient"
import { createClient } from "@/lib/supabase/server"

// Handles the sign-in link from the email: the default PKCE link (?code=) or a
// custom template using {{ .TokenHash }} (?token_hash=&type=).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  if (code || (tokenHash && type)) {
    const supabase = await createClient()
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL("/account/login?error=link", request.url))
}
