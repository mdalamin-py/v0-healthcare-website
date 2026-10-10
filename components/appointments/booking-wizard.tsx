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
import {
  bookAppointment,
  getAvailability,
  type Availability,
  type Booking,
} from "@/app/(site)/appointments/actions"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import { visitInstructions, visitTypeMeta, visitTypes } from "@/lib/clinic/visit-types"
import { AddToCalendar } from "@/components/appointments/add-to-calendar"
import { patientSchema, type PatientInput } from "@/lib/validations/appointment"
import type { Doctor, VisitType } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export type BookableDoctor = Pick<Doctor, "id" | "slug" | "full_name" | "specialty" | "photo_url" | "room" | "visit_types">

const steps = ["Doctor", "Date & time", "Patient details", "Confirmed"] as const


function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Booking progress">
      {steps.map((label, index) => (
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
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
  const initialDoctor = doctors.find((doctor) => doctor.slug === initialSlug) ?? null
  const [step, setStep] = useState(initialDoctor ? 1 : 0)
  const [doctor, setDoctor] = useState<BookableDoctor | null>(initialDoctor)
  const [slots, setSlots] = useState<Availability[] | null>(null)
  const [slot, setSlot] = useState<Availability | null>(null)
  const [visitType, setVisitType] = useState<VisitType>(initialDoctor?.visit_types[0] ?? "in_clinic")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [loadingSlots, startLoadingSlots] = useTransition()

  useEffect(() => {
    if (!doctor) return
    setSlots(null)
    setError(null)
    startLoadingSlots(async () => {
      const result = await getAvailability(doctor.id)
      if (result.ok) setSlots(result.data)
      else setError(result.error)
    })
  }, [doctor])

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
    })
    if (result.ok) {
      setBooking(result.data)
      setStep(3)
    } else {
      setError(result.error)
    }
  })

  const filteredDoctors = doctors.filter((item) => {
    const term = query.trim().toLowerCase()
    return !term || item.full_name.toLowerCase().includes(term) || item.specialty.toLowerCase().includes(term)
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
              Choose a doctor
            </h2>
            <label className="relative mt-5 block">
              <span className="sr-only">Search doctors</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or specialty…"
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {filteredDoctors.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDoctor(item)
                      setSlot(null)
                      setVisitType(item.visit_types[0] ?? "in_clinic")
                      setStep(1)
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <DoctorAvatar name={item.full_name} photoUrl={item.photo_url} className="size-12 rounded-xl text-base" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{item.full_name}</span>
                      <span className="block text-sm text-primary">{item.specialty}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filteredDoctors.length === 0 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">No doctors match your search.</p>
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
              Change doctor
            </button>
            <div className="mt-4 flex items-center gap-4">
              <DoctorAvatar name={doctor.full_name} photoUrl={doctor.photo_url} className="size-14 rounded-2xl text-lg" />
              <div>
                <h2 id="step-date" className="text-2xl font-bold text-foreground">
                  Pick a date with {doctor.full_name}
                </h2>
                <p className="text-sm text-primary">{doctor.specialty}</p>
              </div>
            </div>

            <fieldset className="mt-8">
              <legend className="text-sm font-semibold text-foreground">Visit type</legend>
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
                        <span className="block text-sm font-semibold text-foreground">{meta.label}</span>
                        <span className="block text-xs text-muted-foreground">{meta.description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <h3 className="mt-8 text-sm font-semibold text-foreground">Choose a session</h3>

            {error && (
              <div className="mt-4">
                <ErrorBanner message={error} />
              </div>
            )}

            {loadingSlots || (!slots && !error) ? (
              <div className="mt-8 flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading available dates…
              </div>
            ) : slots && slots.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
                No upcoming sessions in the next 30 days. Please choose another doctor or call us.
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
                            {formatDate(item.appointment_date)}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-3.5" />
                            {formatTimeRange(item.start_time, item.end_time)}
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
                            {full ? "Fully booked" : `${remaining} of ${item.max_patients} spots left`}
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
                Continue
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
              Change date
            </button>
            <h2 id="step-patient" className="mt-4 text-2xl font-bold text-foreground">
              Patient details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visitTypes[visitType].label} with {doctor.full_name} ·{" "}
              {formatDate(slot.appointment_date, { weekday: "long" })} · {formatTimeRange(slot.start_time, slot.end_time)}
            </p>

            <form onSubmit={submit} noValidate className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Patient full name *</Label>
                  <Input autoComplete="name" className="h-11" {...fieldProps("name")} />
                  <FieldError id="name-error" message={errors.name?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input type="tel" autoComplete="tel" placeholder="(559) 123-4567" className="h-11" {...fieldProps("phone")} />
                  <FieldError id="phone-error" message={errors.phone?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input type="email" autoComplete="email" className="h-11" {...fieldProps("email")} />
                  <FieldError id="email-error" message={errors.email?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age (optional)</Label>
                  <Input type="number" inputMode="numeric" min={0} max={130} className="h-11" {...fieldProps("age")} />
                  <FieldError id="age-error" message={errors.age?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (optional)</Label>
                  <select
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    {...fieldProps("gender")}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {visitType === "home_visit" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Home visit address *</Label>
                    <Input autoComplete="street-address" placeholder="Street, city, ZIP" className="h-11" {...fieldProps("address")} />
                    <FieldError id="address-error" message={errors.address?.message} />
                  </div>
                )}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="reason">Reason for visit (optional)</Label>
                  <Textarea rows={3} className="min-h-24" placeholder="Briefly describe the reason for your visit" {...fieldProps("reason")} />
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
                  I agree to be contacted about this appointment and accept the{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <FieldError id="consent-error" message={errors.consent?.message} />

              {error && <ErrorBanner message={error} />}

              <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Booking…
                  </>
                ) : (
                  <>
                    <CalendarCheck className="size-4" />
                    Confirm booking
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
              Appointment booked!
            </h2>
            <p className="mt-2 text-muted-foreground">{visitInstructions[booking.visit_type ?? visitType]}</p>

            <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border border-border text-left">
              <div className="bg-gradient-to-br from-primary to-accent p-6 text-center text-white">
                <p className="text-sm uppercase tracking-wider text-white/80">Your serial number</p>
                <p className="font-display text-6xl font-extrabold">{booking.serial_no}</p>
              </div>
              <dl className="divide-y divide-border bg-background text-sm">
                {[
                  ["Reference", booking.reference],
                  ["Doctor", `${booking.doctor_name} · ${booking.specialty}`],
                  ["Date", formatDate(booking.appointment_date, { weekday: "long", year: "numeric" })],
                  ["Session", formatTimeRange(booking.start_time, booking.end_time)],
                  ["Visit type", visitTypeMeta(booking.visit_type).label],
                  ...(doctor?.room && booking.visit_type === "in_clinic" ? [["Location", doctor.room]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-5 py-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Save your reference <strong className="text-foreground">{booking.reference}</strong> to check or cancel
              your booking.
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
                Print
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/account">View in my account</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
