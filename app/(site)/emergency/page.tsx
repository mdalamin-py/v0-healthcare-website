import type { Metadata } from "next"
import { AlertTriangle, CheckCircle2, Phone, Siren, Stethoscope } from "lucide-react"
import { CallbackForm } from "@/components/emergency/callback-form"
import { OnCallNow, currentShift } from "@/components/schedule/on-call-now"
import { getOnCallShifts } from "@/lib/clinic/queries"
import { site } from "@/lib/site"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Emergency & Urgent Care",
  description: `When to call 911, how to reach our 24/7 on-call clinician, and how to request an urgent callback from ${site.name}.`,
}

const call911 = [
  "Chest pain or pressure, or trouble breathing",
  "Signs of stroke: face drooping, arm weakness, slurred speech",
  "Severe bleeding, a serious fall or head injury",
  "Loss of consciousness, seizures or sudden confusion",
  "Severe allergic reaction or suspected poisoning",
]

const callUs = [
  "A new or worsening symptom that is not life-threatening",
  "Questions about medications or side effects",
  "Wound, catheter or dressing concerns",
  "Fever, pain or swelling after a recent procedure",
  "Changes in care needs after a hospital discharge",
]

export default async function EmergencyPage() {
  const onCall = currentShift(await getOnCallShifts({ days: 1 }))

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-rose-500 text-white">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-[1fr_auto] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Siren className="size-4" />
              Emergency
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">Life-threatening emergency?</h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">
              Call 911 immediately or go to the nearest emergency room. Do not wait for a callback or book an
              appointment online.
            </p>
          </div>
          <a
            href="tel:911"
            className="group flex items-center gap-4 rounded-3xl bg-white px-8 py-6 text-red-600 shadow-2xl shadow-red-900/30 transition-transform hover:scale-[1.02]"
          >
            <span className="relative flex size-14 items-center justify-center rounded-2xl bg-red-600 text-white">
              <span className="absolute inset-0 animate-ping rounded-2xl bg-red-500/40" />
              <Phone className="relative size-7" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-wider text-red-500">Tap to call</span>
              <span className="block font-display text-5xl font-extrabold">911</span>
            </span>
          </a>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <AlertTriangle className="size-5 text-red-600" />
              Call 911 for
            </h2>
            <ul className="mt-5 space-y-3">
              {call911.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Stethoscope className="size-5 text-primary" />
              Call our care team for
            </h2>
            <ul className="mt-5 space-y-3">
              {callUs.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={site.phone.href}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20"
            >
              <Phone className="size-4" />
              {site.phone.display} · {site.hours.onCall}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 pb-16 pt-4 lg:pb-24">
        <div className="container-page grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <OnCallNow shift={onCall} />
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
            <h2 className="text-2xl font-bold text-foreground">Request an urgent callback</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For non-emergency concerns. A nurse from our on-call team will call you back.
            </p>
            <div className="mt-6">
              <CallbackForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
