import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export function isServiceRoleConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Privileged client for trusted server jobs (cron). Bypasses row level
 * security — never use it in code paths reachable by visitors.
 */
export function createServiceClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
