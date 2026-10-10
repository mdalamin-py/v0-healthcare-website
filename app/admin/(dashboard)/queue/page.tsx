import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { CallNextButton } from "@/components/admin/call-next-button"
import { AutoRefresh } from "@/components/queue/auto-refresh"
import { QueueCard } from "@/components/queue/queue-card"
import { requireAdmin } from "@/lib/admin/auth"
import { clinicToday } from "@/lib/clinic/time"
import { listAppointments } from "@/lib/admin/queries"
import type { QueueSession } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default async function AdminQueuePage() {
  const { supabase } = await requireAdmin()
  const [{ data }, appointments] = await Promise.all([
    supabase.rpc("get_today_queue"),
    listAppointments({ date: clinicToday() }),
  ])
  const sessions = (data ?? []) as QueueSession[]

  return (
    <>
      <AdminPageHeader
        title="Live queue"
        description="Call patients in order. The public queue board updates automatically."
        actions={<AutoRefresh seconds={30} />}
      />
      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No sessions are scheduled today.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {sessions.map((session) => {
            const patients = appointments
              .filter((item) => item.schedule_id === session.schedule_id && item.status !== "cancelled")
              .sort((a, b) => a.serial_no - b.serial_no)
            const isActive = (status: string) => status === "pending" || status === "confirmed"
            const withDoctor = patients.some((p) => p.serial_no === session.now_serving && isActive(p.status))
            return (
              <div key={session.schedule_id} className="space-y-3">
                <QueueCard
                  session={session}
                  action={
                    <CallNextButton
                      scheduleId={session.schedule_id}
                      disabled={session.waiting === 0 && !withDoctor}
                      label={session.waiting === 0 && withDoctor ? "Complete current patient" : "Call next patient"}
                    />
                  }
                />
                {patients.length > 0 && (
                  <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
                    {patients.map((patient) => (
                      <li
                        key={patient.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5",
                          patient.serial_no === session.now_serving && isActive(patient.status) && "bg-primary/5",
                        )}
                      >
                        <span className="w-8 font-display font-bold tabular-nums text-primary">#{patient.serial_no}</span>
                        <span className="min-w-0 flex-1 truncate text-foreground">{patient.patient_name}</span>
                        <span className="text-xs capitalize text-muted-foreground">
                          {patient.serial_no === session.now_serving && isActive(patient.status) ? "With doctor" : patient.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
