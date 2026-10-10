import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarCheck, ClipboardList, ShieldCheck } from "lucide-react"
import { OtpLogin } from "@/components/account/otp-login"
import { getPatientSession, safeNext } from "@/lib/auth/patient"
import { isSupabaseConfigured } from "@/lib/supabase/public"
import { getDictionary } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).account.loginMetaTitle, robots: { index: false } }
}

const benefitIcons = [CalendarCheck, ClipboardList, ShieldCheck]

type Props = { searchParams: Promise<{ next?: string | string[]; error?: string }> }

export default async function AccountLoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams
  const { user } = await getPatientSession()
  if (user) redirect(safeNext(next))
  const a = (await getDictionary()).account

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-32 top-0 size-[420px] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[420px] rounded-full bg-accent/15 blur-3xl" />

      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="max-w-lg">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {a.badge}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            {a.heroTitle}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {a.heroText}
          </p>
          <ul className="mt-8 space-y-3">
            {a.benefits.map((text, index) => {
              const Icon = benefitIcons[index]
              return (
                <li key={text} className="flex items-center gap-3 text-foreground">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  {text}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold text-foreground">{a.formTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{a.formText}</p>
          <div className="mt-6">
            {isSupabaseConfigured() ? (
              <OtpLogin next={safeNext(next)} initialError={error === "link" ? a.linkError : undefined} />
            ) : (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                {a.unavailable}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
