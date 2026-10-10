import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Cookie-less client for public data. Keeps pages statically renderable
 * (with ISR) because it never reads request cookies.
 */
export function createPublicClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
