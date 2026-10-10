import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LogOut, UserRound } from "lucide-react"
import { MyAppointments, type PatientAppointment } from "@/components/account/my-appointments"
import { ProfileForm } from "@/components/account/profile-form"
import { clinicToday } from "@/lib/clinic/time"
import { getPatientSession } from "@/lib/auth/patient"
import { getTodayQueue } from "@/lib/clinic/queries"
import { signOutPatient } from "./actions"

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
}

type Props = { searchParams: Promise<{ next?: string }> }

export default async function AccountPage({ searchParams }: Props) {
  const { next } = await searchParams
  const { supabase, user, profile } = await getPatientSession()
  if (!supabase || !user) redirect("/account/login")

  const defaults = { email: user.email ?? undefined, phone: user.phone ? `+${user.phone.replace(/^\+/, "")}` : undefined }

  if (!profile) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container-page max-w-2xl">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
            <UserRound className="size-7" />
          </span>
          <h1 className="mt-6 text-3xl font-extrabold text-foreground md:text-4xl">Complete your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us a little about yourself so our care team can prepare for your visit.
          </p>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <ProfileForm profile={null} defaults={defaults} next={next ?? "/account"} submitLabel="Save and continue" />
          </div>
        </div>
      </section>
    )
  }

  const queue = Object.fromEntries((await getTodayQueue()).map((session) => [session.schedule_id, session.now_serving]))
  const { data } = await supabase
    .from("appointments")
    .select("*, doctor:doctors(full_name, specialty, slug), schedule:doctor_schedules(start_time, end_time)")
    .eq("patient_id", user.id)
    .order("appointment_date", { ascending: false })
    .limit(100)

  return (
    <section className="py-12 lg:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">My account</p>
            <h1 className="mt-1 text-3xl font-extrabold text-foreground md:text-4xl">
              Hello, {profile.full_name.split(" ")[0]}
            </h1>
          </div>
          <form action={signOutPatient}>
            <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MyAppointments appointments={(data ?? []) as unknown as PatientAppointment[]} today={clinicToday()} queue={queue} />
          </div>
          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:sticky lg:top-32">
              <h2 className="text-xl font-bold text-foreground">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Used to prefill your bookings.</p>
              <div className="mt-6">
                <ProfileForm profile={profile} defaults={defaults} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
