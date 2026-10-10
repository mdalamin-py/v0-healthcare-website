import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { LoginForm } from "@/components/admin/login-form"
import { Logo } from "@/components/logo"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import { createClient } from "@/lib/supabase/server"

type Props = { searchParams: Promise<{ error?: string }> }

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  const configured = isSupabaseConfigured()

  if (configured) {
    // Signed-in admins skip the form; signed-in non-admins see it with an error.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: isAdmin } = await supabase.rpc("is_admin")
      if (isAdmin) redirect("/admin")
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <Logo className="justify-center" />
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-foreground">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage doctors, schedules and appointments.</p>
          <div className="mt-6">
            {configured ? (
              <LoginForm initialError={error === "forbidden" ? "This account does not have admin access." : undefined} />
            ) : (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                Supabase is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable the admin dashboard.
              </p>
            )}
          </div>
        </div>
        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to website
        </Link>
      </div>
    </main>
  )
}
