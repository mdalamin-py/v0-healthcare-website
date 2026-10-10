import Link from "next/link"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { clinicToday } from "@/lib/admin/time"
import { listAllDoctors, listAppointments } from "@/lib/admin/queries"
import type { AppointmentStatus } from "@/lib/supabase/types"
import { appointmentStatuses } from "@/lib/validations/admin"

type Props = { searchParams: Promise<{ date?: string; doctor?: string; status?: string }> }

const control =
  "h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export default async function AdminAppointmentsPage({ searchParams }: Props) {
  const params = await searchParams
  const date = params.date === "all" ? undefined : /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : clinicToday()
  const status = appointmentStatuses.includes(params.status as AppointmentStatus)
    ? (params.status as AppointmentStatus)
    : undefined
  const doctorId = params.doctor || undefined

  const [appointments, doctors] = await Promise.all([listAppointments({ date, doctorId, status }), listAllDoctors()])

  return (
    <>
      <AdminPageHeader title="Appointments" description={`${appointments.length} appointments match your filters.`} />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Date
          <input type="date" name="date" defaultValue={date} className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Doctor
          <select name="doctor" defaultValue={doctorId ?? ""} className={control}>
            <option value="">All doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Status
          <select name="status" defaultValue={status ?? ""} className={`${control} capitalize`}>
            <option value="">All statuses</option>
            {appointmentStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="h-10 rounded-xl">
          <Filter className="size-4" />
          Apply
        </Button>
        <Link href="/admin/appointments?date=all" className="h-10 px-2 text-sm font-medium leading-10 text-primary hover:underline">
          Show all dates
        </Link>
      </form>

      <AppointmentsTable appointments={appointments} />
    </>
  )
}
