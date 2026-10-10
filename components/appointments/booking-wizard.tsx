"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Printer,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { useI18n } from "@/components/i18n-provider"
import { fill, translateMessage } from "@/lib/i18n/config"
import {
  bookAppointment,
  getAvailability,
  type Availability,
  type Booking,
} from "@/app/(site)/appointments/actions"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import { visitTypeMeta, visitTypes } from "@/lib/clinic/visit-types"
import { AddToCalendar } from "@/components/appointments/add-to-calendar"
import { patientSchema, type PatientInput } from "@/lib/validations/appointment"
import type { Doctor, VisitType } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export type BookableDoctor = Pick<Doctor, "id" | "slug" | "full_name" | "specialty" | "photo_url" | "room" | "visit_types" | "accepting_appointments">



function Stepper({ current }: { current: number }) {
  const { t } = useI18n()
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label={t.booking.progress}>
      {t.booking.steps.map((label, index) => (
        <li key={label} className="flex flex-col gap-2" aria-current={index === current ? "step" : undefined}>
          <span
            className={cn(
              "h-1.5 rounded-full transition-colors",
              index <= current ? "bg-gradient-to-r from-primary to-accent" : "bg-muted",
            )}
          />
          <span
            className={cn(
              "hidden text-xs font-medium sm:block",
              index === current ? "text-primary" : index < current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  )
}

const staleSlotErrors = ["SESSION_FULL", "INVALID_DATE", "DOCTOR_ON_LEAVE", "SESSION_NOT_FOUND"]

function ErrorBanner({ message, children }: { message: string; children?: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>
        {translateMessage(t.messages, message)} {children}
      </span>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  const { t } = useI18n()
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {translateMessage(t.messages, message)}
    </p>
  )
}

export type PatientDefaults = Partial<Pick<PatientInput, "name" | "phone" | "email" | "age" | "gender" | "address">>

export function BookingWizard({
  doctors,
  initialSlug,
  patient,
}: {
  doctors: BookableDoctor[]
  initialSlug?: string
  patient?: PatientDefaults
}) {
  const { t, locale } = useI18n()
  const b = t.booking
  const initialDoctor = doctors.find((doctor) => doctor.slug === initialSlug && doctor.accepting_appointments) ?? null
  const [step, setStep] = useState(initialDoctor ? 1 : 0)
  const [doctor, setDoctor] = useState<BookableDoctor | null>(initialDoctor)
  const [slots, setSlots] = useState<Availability[] | null>(null)
  const [slot, setSlot] = useState<Availability | null>(null)
  const [visitType, setVisitType] = useState<VisitType>(initialDoctor?.visit_types[0] ?? "in_clinic")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [loadingSlots, startLoadingSlots] = useTransition()

  // Ignore responses for a doctor that is no longer selected.
  useEffect(() => {
    if (!doctor) return
    let current = true
    setSlots(null)
    startLoadingSlots(async () => {
      const result = await getAvailability(doctor.id)
      if (!current) return
      if (result.ok) setSlots(result.data)
      else setSlotError(result.error)
    })
    return () => {
      current = false
    }
  }, [doctor, reloadKey])

  const topRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [step])

  const form = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
      address: "",
      ...patient,
      reason: "",
      consent: false,
    },
    mode: "onTouched",
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (values) => {
    if (!slot) return
    setError(null)
    if (visitType === "home_visit" && (values.address?.trim().length ?? 0) < 5) {
      form.setError("address", { message: "Please enter the address for the home visit" })
      return
    }
    const result = await bookAppointment({
      ...values,
      scheduleId: slot.schedule_id,
      date: slot.appointment_date,
      visitType,
    }).catch(() => ({ ok: false as const, error: b.networkError, code: undefined }))
    if (result.ok) {
      setBooking(result.data)
      setStep(3)
    } else if (result.code && staleSlotErrors.includes(result.code)) {
      // The chosen session changed under us: refresh dates and send the patient back.
      setSlot(null)
      setSlotError(result.error)
      setReloadKey((key) => key + 1)
      setStep(1)
    } else if (result.code === "NOT_ACCEPTING") {
      setDoctor(null)
      setStep(0)
      setError({ message: result.error })
    } else {
      setError({ message: result.error, code: result.code })
    }
  })

  const filteredDoctors = doctors.filter((item) => {
    const term = query.trim().toLowerCase()
    const specialty = (t.clinic.specialties[item.specialty] ?? item.specialty).toLowerCase()
    return (
      !term ||
      item.full_name.toLowerCase().includes(term) ||
      item.specialty.toLowerCase().includes(term) ||
      specialty.includes(term)
    )
  })

  const fieldProps = (name: keyof PatientInput) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    ...form.register(name),
  })

  return (
    <div ref={topRef} className="scroll-mt-28 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <Stepper current={step} />

      <div className="mt-8">
        {/* Step 1 — doctor */}
        {step === 0 && (
          <section aria-labelledby="step-doctor">
            <h2 id="step-doctor" className="text-2xl font-bold text-foreground">
              {b.chooseDoctor}
            </h2>
            {error && (
              <div className="mt-4">
                <ErrorBanner message={error.message} />
              </div>
            )}
            <label className="relative mt-5 block">
              <span className="sr-only">{b.searchDoctors}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={b.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {filteredDoctors.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!item.accepting_appointments}
                    onClick={() => {
                      setDoctor(item)
                      setSlot(null)
                      setSlotError(null)
                      setError(null)
                      setVisitType(item.visit_types[0] ?? "in_clinic")
                      setStep(1)
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-none"
                  >
                    <DoctorAvatar name={item.full_name} photoUrl={item.photo_url} className="size-12 rounded-xl text-base" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{item.full_name}</span>
                      <span className="block text-sm text-primary">{t.clinic.specialties[item.specialty] ?? item.specialty}</span>
                      {!item.accepting_appointments && (
                        <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {b.notAccepting}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filteredDoctors.length === 0 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">{b.noDoctorMatch}</p>
            )}
          </section>
        )}

        {/* Step 2 — date & session */}
        {step === 1 && doctor && (
          <section aria-labelledby="step-date">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              {b.changeDoctor}
            </button>
            <div className="mt-4 flex items-center gap-4">
              <DoctorAvatar name={doctor.full_name} photoUrl={doctor.photo_url} className="size-14 rounded-2xl text-lg" />
              <div>
                <h2 id="step-date" className="text-2xl font-bold text-foreground">
                  {fill(b.pickDate, { name: doctor.full_name })}
                </h2>
                <p className="text-sm text-primary">{t.clinic.specialties[doctor.specialty] ?? doctor.specialty}</p>
              </div>
            </div>

            <fieldset className="mt-8">
              <legend className="text-sm font-semibold text-foreground">{b.visitType}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {doctor.visit_types.map((type) => {
                  const meta = visitTypes[type]
                  const selected = visitType === type
                  return (
                    <label
                      key={type}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                        selected ? "border-primary bg-primary/10 shadow-md" : "border-border bg-background hover:border-primary/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="visitType"
                        value={type}
                        checked={selected}
                        onChange={() => setVisitType(type)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                        )}
                      >
                        <meta.icon className="size-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{t.clinic.visit[type].label}</span>
                        <span className="block text-xs text-muted-foreground">{t.clinic.visit[type].description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <h3 className="mt-8 text-sm font-semibold text-foreground">{b.chooseSession}</h3>

            {slotError && (
              <div className="mt-4">
                <ErrorBanner message={slotError} />
              </div>
            )}

            {loadingSlots || (!slots && !slotError) ? (
              <div className="mt-8 flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                {b.loadingDates}
              </div>
            ) : slots && slots.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
                {b.noSessions}
              </p>
            ) : (
              slots && (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((item) => {
                    const remaining = Math.max(item.max_patients - item.booked, 0)
                    const full = remaining === 0
                    const selected =
                      slot?.schedule_id === item.schedule_id && slot.appointment_date === item.appointment_date
                    return (
                      <li key={`${item.schedule_id}-${item.appointment_date}`}>
                        <button
                          type="button"
                          disabled={full}
                          aria-pressed={selected}
                          onClick={() => setSlot(item)}
                          className={cn(
                            "w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            selected
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-background hover:border-primary/50",
                            full && "cursor-not-allowed opacity-50 hover:border-border",
                          )}
                        >
                          <span className="block font-semibold text-foreground">
                            {formatDate(item.appointment_date, {}, locale)}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-3.5" />
                            {formatTimeRange(item.start_time, item.end_time, locale)}
                          </span>
                          <span
                            className={cn(
                              "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              full
                                ? "bg-destructive/10 text-destructive"
                                : remaining <= 3
                                  ? "bg-star/15 text-foreground"
                                  : "bg-accent/15 text-accent",
                            )}
                          >
                            {full ? b.fullyBooked : fill(b.spotsLeft, { remaining, total: item.max_patients }, locale)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )
            )}

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                className="rounded-full px-8"
                disabled={!slot}
                onClick={() => {
                  setError(null)
                  setStep(2)
                }}
              >
                {b.continue}
              </Button>
            </div>
          </section>
        )}

        {/* Step 3 — patient */}
        {step === 2 && doctor && slot && (
          <section aria-labelledby="step-patient">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              {b.changeDate}
            </button>
            <h2 id="step-patient" className="mt-4 text-2xl font-bold text-foreground">
              {b.patientDetails}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {fill(b.summary, { visit: t.clinic.visit[visitType].label, doctor: doctor.full_name })} ·{" "}
              {formatDate(slot.appointment_date, { weekday: "long" }, locale)} · {formatTimeRange(slot.start_time, slot.end_time, locale)}
            </p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">{b.name}</Label>
                  <Input autoComplete="name" className="h-11" {...fieldProps("name")} />
                  <FieldError id="name-error" message={errors.name?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{b.phone}</Label>
                  <Input type="tel" autoComplete="tel" placeholder="(559) 123-4567" className="h-11" {...fieldProps("phone")} />
                  <FieldError id="phone-error" message={errors.phone?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{b.email}</Label>
                  <Input type="email" autoComplete="email" className="h-11" {...fieldProps("email")} />
                  <FieldError id="email-error" message={errors.email?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{b.age}</Label>
                  <Input type="number" inputMode="numeric" min={0} max={130} className="h-11" {...fieldProps("age")} />
                  <FieldError id="age-error" message={errors.age?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{b.gender}</Label>
                  <select
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    {...fieldProps("gender")}
                  >
                    <option value="">{b.genderNone}</option>
                    <option value="female">{b.female}</option>
                    <option value="male">{b.male}</option>
                    <option value="other">{b.other}</option>
                  </select>
                </div>
                {visitType === "home_visit" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">{b.address}</Label>
                    <Input autoComplete="street-address" placeholder={b.addressPlaceholder} className="h-11" {...fieldProps("address")} />
                    <FieldError id="address-error" message={errors.address?.message} />
                  </div>
                )}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reason">{b.reason}</Label>
                  <Textarea rows={3} className="min-h-24" placeholder={b.reasonPlaceholder} {...fieldProps("reason")} />
                  <FieldError id="reason-error" message={errors.reason?.message} />
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  {...form.register("consent")}
                />
                <span>
                  {b.consentLead}{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    {b.privacyPolicy}
                  </Link>
                  .
                </span>
              </label>
              <FieldError id="consent-error" message={errors.consent?.message} />

              {error && (
                <ErrorBanner message={error.message}>
                  {error.code === "AUTH_REQUIRED" && (
                    <Link href={`/account/login?next=${encodeURIComponent(`/appointments/book?doctor=${doctor.slug}`)}`} className="font-semibold underline">
                      {b.signInAgain}
                    </Link>
                  )}
                </ErrorBanner>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {b.booking}
                  </>
                ) : (
                  <>
                    <CalendarCheck className="size-4" />
                    {b.confirm}
                  </>
                )}
              </Button>
            </form>
          </section>
        )}

        {/* Step 4 — confirmation */}
        {step === 3 && booking && (
          <section aria-labelledby="step-done" className="text-center" role="status">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <CheckCircle2 className="size-8" />
            </span>
            <h2 id="step-done" className="mt-5 text-3xl font-bold text-foreground">
              {b.booked}
            </h2>
            <p className="mt-2 text-muted-foreground">{t.clinic.visit[booking.visit_type ?? visitType].instructions}</p>

            <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-border text-left">
              <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
                <p className="text-sm uppercase tracking-wider text-white/80">{b.yourSerial}</p>
                <p className="font-display text-6xl font-extrabold">{booking.serial_no}</p>
              </div>
              <dl className="divide-y divide-border bg-background text-sm">
                {[
                  [b.reference, booking.reference],
                  [b.doctor, `${booking.doctor_name} · ${t.clinic.specialties[booking.specialty] ?? booking.specialty}`],
                  [b.date, formatDate(booking.appointment_date, { weekday: "long", year: "numeric" }, locale)],
                  [b.session, formatTimeRange(booking.start_time, booking.end_time, locale)],
                  [b.visitType, t.clinic.visit[booking.visit_type ?? visitType].label],
                  ...(doctor?.room && booking.visit_type === "in_clinic" ? [[b.location, doctor.room]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-5 py-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {fill(b.saveReference, { reference: booking.reference })}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
              <AddToCalendar
                appointment={{
                  ...booking,
                  visitLabel: visitTypeMeta(booking.visit_type).label,
                }}
              />
              <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
                <Printer className="size-4" />
                {b.print}
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/account">{b.viewAccount}</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
