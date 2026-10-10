import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AddTheatreForm, ScheduleSurgeryForm, SurgeryControls, TheatreStatusControl } from "@/components/admin/ot-controls"
import { listAllDoctors, listSurgeries } from "@/lib/admin/queries"
import { requireAdmin } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/clinic/format"
import { surgeryStatuses } from "@/lib/clinic/ot"
import type { OperationTheatre } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default async function AdminOtPage() {
  const { supabase } = await requireAdmin()
  const [{ data: theatreData }, surgeries, doctors] = await Promise.all([
    supabase.from("operation_theatres").select("*").order("code"),
    listSurgeries(7),
    listAllDoctors(),
  ])
  const theatres = (theatreData ?? []) as OperationTheatre[]
  const surgeons = doctors.filter((doctor) => doctor.is_active && doctor.kind !== "intern")
  const active = surgeries.filter((surgery) => surgery.status === "in_progress").length

  return (
    <>
      <AdminPageHeader
        title="Operation theatres"
        description={`${active} in progress · ${surgeries.length} operations in the next 7 days. Updates appear live on the public OT board.`}
      />

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Theatres</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {theatres.map((theatre) => (
            <li key={theatre.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div>
                <p className="font-display text-lg font-bold text-foreground">{theatre.code}</p>
                <p className="text-sm text-muted-foreground">{theatre.name}</p>
              </div>
              <div className="w-48">
                <TheatreStatusControl theatre={theatre} />
              </div>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-2xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">Add a theatre</summary>
          <div className="mt-4">
            <AddTheatreForm />
          </div>
        </details>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Operations</h2>
        {surgeries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground">
            No operations in the next 7 days.
          </p>
        ) : (
          <ul className="space-y-3">
            {surgeries.map((surgery) => (
              <li
                key={surgery.id}
                data-case={surgery.case_code}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm xl:flex-row xl:items-start",
                  surgery.status === "in_progress" ? "border-red-500/40" : "border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {surgery.case_code} · {surgery.procedure}
                    </p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", surgeryStatuses[surgery.status].className)}>
                      {surgeryStatuses[surgery.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(surgery.scheduled_at)} · {surgery.duration_minutes} min · {surgery.theatre.code} ·{" "}
                    {surgery.surgeon.full_name}
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">Patient: {surgery.patient_name}</p>
                  {surgery.note && <p className="mt-1 text-xs text-muted-foreground">Note: {surgery.note}</p>}
                </div>
                <SurgeryControls id={surgery.id} status={surgery.status} note={surgery.note} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-1 font-semibold text-foreground">Schedule an operation</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A case code is generated automatically. Give it to the family so they can follow progress on the OT board.
        </p>
        <ScheduleSurgeryForm
          theatres={theatres.map(({ id, code, name }) => ({ id, code, name }))}
          surgeons={surgeons.map(({ id, full_name, specialty }) => ({ id, full_name, specialty }))}
        />
      </section>
    </>
  )
}
