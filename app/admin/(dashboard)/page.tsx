import Link from "next/link"
import { ArrowRight, CalendarCheck, CalendarClock, CheckCircle2, Clock, Moon, Stethoscope } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { formatDate, formatDateTime } from "@/lib/clinic/format"
import { clinicToday } from "@/lib/admin/time"
import { listAllDoctors, listAppointments, listUpcomingShifts } from "@/lib/admin/queries"

export default async function AdminDashboardPage() {
  const today = clinicToday()
  const [appointments, doctors, shifts] = await Promise.all([
    listAppointments({ date: today }),
    listAllDoctors(),
    listUpcomingShifts(1),
  ])

  const count = (status: string) => appointments.filter((item) => item.status === status).length
  const now = new Date()
  const onCall = shifts.find((shift) => new Date(shift.starts_at) <= now && now < new Date(shift.ends_at))

  const cards = [
    { label: "Today's appointments", value: appointments.length, icon: CalendarClock, tone: "bg-primary/10 text-primary" },
    { label: "Pending", value: count("pending"), icon: Clock, tone: "bg-star/15 text-foreground" },
    { label: "Confirmed", value: count("confirmed"), icon: CalendarCheck, tone: "bg-accent/15 text-accent" },
    { label: "Completed", value: count("completed"), icon: CheckCircle2, tone: "bg-primary/10 text-primary" },
  ]

  return (
    <>
      <AdminPageHeader title="Dashboard" description={formatDate(today, { weekday: "long", year: "numeric", month: "long" })} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className={`flex size-10 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/on-call"
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-accent">
            <Moon className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">On call now</span>
            <span className="block font-semibold text-foreground">{onCall ? onCall.doctor.full_name : "Nobody scheduled"}</span>
            {onCall && <span className="text-sm text-muted-foreground">Until {formatDateTime(onCall.ends_at)}</span>}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/admin/doctors"
          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctors</span>
            <span className="block font-semibold text-foreground">
              {doctors.filter((doctor) => doctor.is_active).length} active · {doctors.length} total
            </span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Today&apos;s queue</h2>
        <Link href="/admin/appointments" className="text-sm font-medium text-primary hover:underline">
          All appointments
        </Link>
      </div>
      <AppointmentsTable appointments={appointments} showDate={false} />
    </>
  )
}
