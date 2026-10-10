import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Ensures the current request belongs to a signed-in admin.
 * Redirects to the login page otherwise.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { data: isAdmin } = await supabase.rpc("is_admin")
  if (!isAdmin) redirect("/admin/login?error=forbidden")

  return { supabase, user }
})
