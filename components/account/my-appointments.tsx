"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { CalendarPlus, Clock, Loader2, MessageSquareHeart, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VisitTypeBadge } from "@/components/visit-type-badge"
import { AddToCalendar } from "@/components/appointments/add-to-calendar"
import { ReviewForm } from "@/components/account/review-form"
import { StarRating } from "@/components/star-rating"
import { visitTypeMeta } from "@/lib/clinic/visit-types"
import { cancelMyAppointment } from "@/app/(site)/account/actions"
import { formatDate, formatTime, formatTimeRange } from "@/lib/clinic/format"
import type { Appointment, AppointmentStatus, Doctor, DoctorSchedule } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export type MyReview = { rating: number; status: "pending" | "approved" | "rejected" }

export type PatientAppointment = Appointment & {
  doctor: Pick<Doctor, "full_name" | "specialty" | "slug"> | null
  schedule: Pick<DoctorSchedule, "start_time" | "end_time"> | null
}

const statusStyles: Record<AppointmentStatus, string> = {
  pending: "bg-star/15 text-foreground",
  confirmed: "bg-accent/15 text-accent",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
}

function AppointmentRow({
  appointment,
  canCancel,
  nowServing,
  review,
}: {
  appointment: PatientAppointment
  canCancel: boolean
  nowServing?: number
  review?: MyReview
}) {
  const [reviewing, setReviewing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Serial</span>
          <span className="font-display text-2xl font-extrabold leading-none">{appointment.serial_no}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{appointment.doctor?.full_name ?? "Doctor"}</p>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[appointment.status])}>
              {appointment.status}
            </span>
          </div>
          <p className="text-sm text-primary">{appointment.doctor?.specialty}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{formatDate(appointment.appointment_date, { weekday: "long", year: "numeric" })}</span>
            {appointment.reporting_time ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Clock className="size-3.5" />
                Arrive by {formatTime(appointment.reporting_time)}
              </span>
            ) : null}
            {appointment.schedule && (
              <span>Session {formatTimeRange(appointment.schedule.start_time, appointment.schedule.end_time)}</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VisitTypeBadge type={appointment.visit_type} />
            <span className="font-mono text-xs text-muted-foreground">{appointment.reference}</span>
          </div>
          {nowServing !== undefined && (
            <Link
              href="/queue"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              {nowServing === 0
                ? "Queue not started yet"
                : nowServing >= appointment.serial_no
                  ? "It's your turn — please proceed"
                  : `Now serving #${nowServing} · you are #${appointment.serial_no}`}
            </Link>
          )}
        </div>
        {canCancel && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {appointment.schedule && appointment.doctor && !confirming && (
              <AddToCalendar
                className="px-3 py-1.5 text-xs"
                appointment={{
                  reference: appointment.reference,
                  appointment_date: appointment.appointment_date,
                  start_time: appointment.schedule.start_time,
                  end_time: appointment.schedule.end_time,
                  doctor_name: appointment.doctor.full_name,
                  specialty: appointment.doctor.specialty,
                  serial_no: appointment.serial_no,
                  reporting_time: appointment.reporting_time,
                  visitLabel: visitTypeMeta(appointment.visit_type).label,
                }}
              />
            )}
            {confirming ? (
              <>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConfirming(false)}>
                  Keep
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await cancelMyAppointment(appointment.id)
                      if (!result.ok) setError(result.error)
                      setConfirming(false)
                    })
                  }
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Cancel visit
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConfirming(true)}>
                <XCircle className="size-4" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {appointment.status === "completed" &&
        (review || submitted ? (
          <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
            {review && <StarRating rating={review.rating} />}
            {submitted || review?.status === "pending"
              ? "Thanks! Your review will appear after a quick check."
              : review?.status === "approved"
                ? "Your review is published."
                : "Your review was not published."}
          </p>
        ) : reviewing ? (
          <ReviewForm
            appointmentId={appointment.id}
            onDone={() => {
              setReviewing(false)
              setSubmitted(true)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <MessageSquareHeart className="size-4" />
            Rate your visit
          </button>
        ))}
    </li>
  )
}

export function MyAppointments({
  appointments,
  today,
  queue = {},
  reviews = {},
}: {
  appointments: PatientAppointment[]
  today: string
  queue?: Record<string, number>
  reviews?: Record<string, MyReview>
}) {
  const upcoming = appointments
    .filter((item) => item.appointment_date >= today && (item.status === "pending" || item.status === "confirmed"))
    .sort(
      (a, b) =>
        a.appointment_date.localeCompare(b.appointment_date) ||
        (a.reporting_time ?? a.schedule?.start_time ?? "").localeCompare(b.reporting_time ?? b.schedule?.start_time ?? "") ||
        a.serial_no - b.serial_no,
    )
  const history = appointments.filter((item) => !upcoming.includes(item))

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">Upcoming appointments</h2>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/appointments/book">
              <CalendarPlus className="size-4" />
              Book new
            </Link>
          </Button>
        </div>
        {upcoming.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {upcoming.map((item) => (
              <AppointmentRow
                key={item.id}
                appointment={item}
                canCancel
                nowServing={item.appointment_date === today ? queue[item.schedule_id] : undefined}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground">
            You have no upcoming appointments.
          </p>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground">Past & cancelled</h2>
          <ul className="mt-4 space-y-3">
            {history.map((item) => (
              <AppointmentRow key={item.id} appointment={item} canCancel={false} review={reviews[item.id]} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
