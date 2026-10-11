import { NextResponse, type NextRequest } from "next/server"
import { listAppointments } from "@/lib/admin/queries"
import { visitTypeMeta } from "@/lib/clinic/visit-types"
import type { AppointmentStatus } from "@/lib/supabase/types"
import { appointmentStatuses } from "@/lib/validations/admin"

const isDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined)

/** Escapes a CSV cell and neutralizes spreadsheet formula injection. */
function cell(value: unknown) {
  let text = value == null ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const status = params.get("status")
  const appointments = await listAppointments({
    from: isDate(params.get("from")),
    to: isDate(params.get("to")),
    date: isDate(params.get("date")),
    doctorId: params.get("doctor") || undefined,
    status: appointmentStatuses.includes(status as AppointmentStatus) ? (status as AppointmentStatus) : undefined,
    search: params.get("q") || undefined,
    limit: 5000,
  })

  const header = ["Reference", "Date", "Session", "Serial", "Arrive by", "Status", "Visit type", "Doctor", "Specialty", "Patient", "Phone", "Email", "Age", "Address", "Reason"]
  const rows = appointments.map((item) => [
    item.reference,
    item.appointment_date,
    item.schedule ? `${item.schedule.start_time.slice(0, 5)}-${item.schedule.end_time.slice(0, 5)}` : "",
    item.serial_no,
    item.reporting_time?.slice(0, 5) ?? "",
    item.status,
    visitTypeMeta(item.visit_type).label,
    item.doctor?.full_name,
    item.doctor?.specialty,
    item.patient_name,
    item.patient_phone,
    item.patient_email,
    item.patient_age,
    item.patient_address,
    item.reason,
  ])
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="appointments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
