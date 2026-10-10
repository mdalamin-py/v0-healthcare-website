import "server-only"
import { cache } from "react"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import { createClient } from "@/lib/supabase/server"
import type { Patient } from "@/lib/supabase/types"

/** Current signed-in user and their patient profile (if completed). */
export const getPatientSession = cache(async () => {
  if (!isSupabaseConfigured()) return { supabase: null, user: null, profile: null as Patient | null }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null as Patient | null }

  const { data: profile } = await supabase.from("patients").select("*").eq("user_id", user.id).maybeSingle()
  return { supabase, user, profile: (profile as Patient | null) ?? null }
})

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}
