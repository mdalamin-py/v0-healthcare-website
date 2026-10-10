import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarCheck, ClipboardList, ShieldCheck } from "lucide-react"
import { OtpLogin } from "@/components/account/otp-login"
import { getPatientSession, safeNext } from "@/lib/auth/patient"
import { isSupabaseConfigured } from "@/lib/supabase/public"

export const metadata: Metadata = {
  title: "Sign in or create an account",
  robots: { index: false },
}

const benefits = [
  { icon: CalendarCheck, text: "Book appointments in a few taps" },
  { icon: ClipboardList, text: "See your upcoming and past visits" },
  { icon: ShieldCheck, text: "Secure, password-free sign in" },
]

type Props = { searchParams: Promise<{ next?: string | string[]; error?: string }> }

export default async function AccountLoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams
  const { user } = await getPatientSession()
  if (user) redirect(safeNext(next))

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-32 top-0 size-[420px] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[420px] rounded-full bg-accent/15 blur-3xl" />

      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="max-w-lg">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Patient account
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            Your care, all in one place
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Sign in or create an account with your email or mobile number. No passwords to remember — we send you a
            one-time code.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit.text} className="flex items-center gap-3 text-foreground">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <benefit.icon className="size-4" />
                </span>
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold text-foreground">Sign in or sign up</h2>
          <p className="mt-1 text-sm text-muted-foreground">Continue with your email or mobile number.</p>
          <div className="mt-6">
            {isSupabaseConfigured() ? (
              <OtpLogin next={safeNext(next)} initialError={error === "link" ? "That sign-in link is invalid or has expired." : undefined} />
            ) : (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                Patient accounts are temporarily unavailable. Please call us to book an appointment.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
