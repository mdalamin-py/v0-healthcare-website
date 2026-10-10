import "server-only"
import { cache } from "react"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import { createClient } from "@/lib/supabase/server"
import type { Doctor } from "@/lib/supabase/types"

/** The signed-in user and the doctor their email is linked to, if any. */
export const getDoctorSession = cache(async () => {
  if (!isSupabaseConfigured()) return { supabase: null, user: null, doctor: null as Doctor | null }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, doctor: null as Doctor | null }

  const { data: doctorId } = await supabase.rpc("current_doctor_id")
  if (!doctorId) return { supabase, user, doctor: null as Doctor | null }

  const { data: doctor } = await supabase.from("doctors").select("*").eq("id", doctorId).single()
  return { supabase, user, doctor: (doctor as Doctor | null) ?? null }
})
