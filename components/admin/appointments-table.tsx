import { StatusSelect } from "@/components/admin/status-select"
import { formatDate, formatTimeRange } from "@/lib/clinic/format"
import type { AdminAppointment } from "@/lib/admin/queries"

export function AppointmentsTable({ appointments, showDate = true }: { appointments: AdminAppointment[]; showDate?: boolean }) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
        No appointments found.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">#</th>
            <th scope="col" className="px-4 py-3 font-semibold">Patient</th>
            <th scope="col" className="px-4 py-3 font-semibold">Doctor</th>
            {showDate && <th scope="col" className="px-4 py-3 font-semibold">Date</th>}
            <th scope="col" className="px-4 py-3 font-semibold">Session</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="align-top transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 font-display font-bold text-primary">
                  {appointment.serial_no}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-foreground">{appointment.patient_name}</p>
                <p className="text-muted-foreground">
                  <a href={`tel:${appointment.patient_phone}`} className="hover:text-primary">
                    {appointment.patient_phone}
                  </a>
                  {appointment.patient_age != null && ` · ${appointment.patient_age} yrs`}
                </p>
                {appointment.reason && (
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground" title={appointment.reason}>
                    {appointment.reason.length > 80 ? `${appointment.reason.slice(0, 80)}…` : appointment.reason}
                  </p>
                )}
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{appointment.reference}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{appointment.doctor?.full_name}</p>
                <p className="text-xs text-primary">{appointment.doctor?.specialty}</p>
              </td>
              {showDate && <td className="whitespace-nowrap px-4 py-3 text-foreground">{formatDate(appointment.appointment_date)}</td>}
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {appointment.schedule && formatTimeRange(appointment.schedule.start_time, appointment.schedule.end_time)}
              </td>
              <td className="px-4 py-3">
                <StatusSelect id={appointment.id} status={appointment.status} label={appointment.patient_name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
