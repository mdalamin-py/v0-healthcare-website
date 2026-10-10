import Link from "next/link"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Moon,
  Plus,
  UserPlus,
  XCircle,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { SendSerialListsButton } from "@/components/admin/send-serial-lists-button"
import { BreakdownList } from "@/components/admin/breakdown-list"
import { DailyBarChart } from "@/components/admin/daily-bar-chart"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import {
  addDays,
  completionRate,
  dailyCounts,
  doctorLoad,
  percentChange,
  statusCounts,
  visitTypeCounts,
} from "@/lib/admin/analytics"
import { clinicToday } from "@/lib/clinic/time"
import { listAppointments, listRecentPatients, listUpcomingShifts } from "@/lib/admin/queries"
import { formatDate, formatDateTime } from "@/lib/clinic/format"
import { visitTypes } from "@/lib/clinic/visit-types"
import { cn } from "@/lib/utils"

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Los_Angeles" }).format(new Date()),
  )
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
}

function Trend({ change }: { change: number | null }) {
  if (change === null) return <span className="text-xs text-muted-foreground">New this week</span>
  const up = change >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-accent" : "text-destructive")}>
      <Icon className="size-3.5" />
      {Math.abs(change)}% vs last week
    </span>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  footer,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  footer: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/5" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <div className="mt-1">{footer}</div>
    </div>
  )
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default async function AdminDashboardPage() {
  const today = clinicToday()
  const from = addDays(today, -13)
  const [recent, upcoming, shifts, newPatients] = await Promise.all([
    listAppointments({ from: addDays(today, -20), to: today }),
    listAppointments({ from: addDays(today, 1), to: addDays(today, 7) }),
    listUpcomingShifts(1),
    listRecentPatients(`${addDays(today, -6)}T00:00:00Z`),
  ])

  const todays = recent.filter((item) => item.appointment_date === today)
  const thisWeek = recent.filter((item) => item.appointment_date > addDays(today, -7) && item.status !== "cancelled").length
  const lastWeek = recent.filter(
    (item) => item.appointment_date > addDays(today, -14) && item.appointment_date <= addDays(today, -7) && item.status !== "cancelled",
  ).length
  const range = recent.filter((item) => item.appointment_date >= from)
  const statuses = statusCounts(range)
  const visits = visitTypeCounts([...range, ...upcoming])
  const load = doctorLoad([...todays, ...upcoming]).slice(0, 5)
  const rate = completionRate(range, today)
  const now = new Date()
  const onCall = shifts.find(
    (shift) => (shift.duty_type ?? "on_call") === "on_call" && new Date(shift.starts_at) <= now && now < new Date(shift.ends_at),
  )
  const pendingToday = todays.filter((item) => item.status === "pending").length

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{formatDate(today, { weekday: "long", year: "numeric", month: "long" })}</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">{greeting()}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <SendSerialListsButton />
          <Link
            href={`/admin/appointments/export?from=${from}&to=${addDays(today, 30)}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <Download className="size-4" />
            Export CSV
          </Link>
          <Link
            href="/admin/on-call"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <Moon className="size-4" />
            Add shift
          </Link>
          <Link
            href="/admin/doctors/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-lg shadow-primary/20"
          >
            <Plus className="size-4" />
            New doctor
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Today's appointments"
          value={todays.filter((item) => item.status !== "cancelled").length}
          icon={CalendarClock}
          footer={<span className="text-xs text-muted-foreground">{pendingToday} awaiting confirmation</span>}
        />
        <Kpi label="Last 7 days" value={thisWeek} icon={CalendarRange} footer={<Trend change={percentChange(thisWeek, lastWeek)} />} />
        <Kpi
          label="Completion rate"
          value={rate === null ? "—" : `${rate}%`}
          icon={CheckCircle2}
          footer={<span className="text-xs text-muted-foreground">Past visits, last 14 days</span>}
        />
        <Kpi
          label="New patients"
          value={newPatients.length}
          icon={UserPlus}
          footer={<span className="text-xs text-muted-foreground">Accounts created this week</span>}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel
          title="Appointments · last 14 days"
          className="xl:col-span-2"
          action={<span className="text-xs text-muted-foreground">Excludes cancellations</span>}
        >
          <DailyBarChart data={dailyCounts(range, from, 14)} today={today} label="Appointments per day, last 14 days" />
        </Panel>

        <div className="space-y-6">
          <Link
            href="/admin/on-call"
            className="group relative block overflow-hidden rounded-2xl bg-slate-950 p-6 text-slate-300 shadow-xl"
          >
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/30 blur-3xl" />
            <p className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              On call now
            </p>
            <p className="relative mt-3 font-display text-xl font-bold text-white">
              {onCall ? onCall.doctor.full_name : "Nobody scheduled"}
            </p>
            <p className="relative mt-1 text-sm">
              {onCall ? `Until ${formatDateTime(onCall.ends_at)}` : "Add an on-call shift to cover this time."}
            </p>
            <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-white">
              Manage roster
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Panel title="Status · last 14 days">
            <BreakdownList
              rows={[
                { label: "Pending", value: statuses.get("pending") ?? 0, icon: Clock, barClassName: "bg-star" },
                { label: "Confirmed", value: statuses.get("confirmed") ?? 0, icon: CalendarCheck, barClassName: "bg-accent" },
                { label: "Completed", value: statuses.get("completed") ?? 0, icon: CheckCircle2, barClassName: "bg-primary" },
                { label: "Cancelled", value: statuses.get("cancelled") ?? 0, icon: XCircle, barClassName: "bg-destructive" },
              ]}
            />
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Visit types">
          <BreakdownList
            rows={(Object.keys(visitTypes) as (keyof typeof visitTypes)[]).map((type) => ({
              label: visitTypes[type].label,
              value: visits.get(type) ?? 0,
              icon: visitTypes[type].icon,
            }))}
          />
        </Panel>
        <Panel
          title="Busiest doctors · next 7 days"
          action={
            <Link href="/admin/doctors" className="text-xs font-medium text-primary hover:underline">
              All doctors
            </Link>
          }
        >
          {load.length > 0 ? (
            <ul className="space-y-3">
              {load.map((doctor) => (
                <li key={doctor.name} className="flex items-center gap-3">
                  <DoctorAvatar name={doctor.name} photoUrl={null} className="size-9 rounded-xl text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{doctor.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{doctor.count}</span> booked
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming bookings yet.</p>
          )}
        </Panel>
      </div>

      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Today&apos;s queue</h2>
        <Link href="/admin/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          All appointments
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <AppointmentsTable appointments={todays} showDate={false} />
    </>
  )
}
