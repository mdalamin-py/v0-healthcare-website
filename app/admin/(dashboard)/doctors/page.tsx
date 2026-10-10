import Link from "next/link"
import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DoctorAvatar } from "@/components/doctors/doctor-avatar"
import { weekdays, weekOrder } from "@/lib/clinic/format"
import { ApplicationReview } from "@/components/admin/application-review"
import { requireAdmin } from "@/lib/admin/auth"
import { listAllDoctors } from "@/lib/admin/queries"
import { formatDateTime } from "@/lib/clinic/format"
import type { DoctorApplication } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default async function AdminDoctorsPage() {
  const { supabase } = await requireAdmin()
  const [doctors, { data: applicationData }] = await Promise.all([
    listAllDoctors(),
    supabase.from("doctor_applications").select("*").eq("status", "pending").order("created_at"),
  ])
  const applications = (applicationData ?? []) as DoctorApplication[]

  return (
    <>
      <AdminPageHeader
        title="Doctors"
        description="Manage profiles, weekly sessions and visibility on the website."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/doctors/new">
              <Plus className="size-4" />
              Add doctor
            </Link>
          </Button>
        }
      />

      {applications.length > 0 && (
        <section className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-semibold text-foreground">
            Doctor registrations awaiting review ({applications.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {applications.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-foreground">
                    {application.full_name} · <span className="text-primary">{application.specialty}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {application.qualification} · {application.experience_years} yrs · License {application.license_number}
                  </p>
                  <p className="text-muted-foreground">
                    {application.email} · {application.phone} · {application.languages.join(", ")}
                  </p>
                  {application.bio && <p className="mt-1 text-foreground/80">{application.bio}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Applied {formatDateTime(application.created_at)}</p>
                </div>
                <ApplicationReview id={application.id} name={application.full_name} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {doctors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No doctors yet. Add your first doctor to start taking appointments.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => {
            const days = new Set(doctor.doctor_schedules.map((schedule) => schedule.weekday))
            return (
              <li key={doctor.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <DoctorAvatar name={doctor.full_name} photoUrl={doctor.photo_url} className="size-12 rounded-xl text-base" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{doctor.full_name}</p>
                    <p className="text-sm text-primary">
                      {doctor.specialty}
                      {doctor.kind === "intern" && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Intern</span>}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      doctor.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {doctor.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="mt-4 flex gap-1">
                  {weekOrder.map((day) => (
                    <span
                      key={day}
                      title={weekdays[day].long}
                      className={cn(
                        "flex h-7 flex-1 items-center justify-center rounded-md text-[11px] font-medium",
                        days.has(day) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/50",
                      )}
                    >
                      {weekdays[day].short.slice(0, 2)}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">{doctor.doctor_schedules.length} weekly sessions</span>
                  <Link
                    href={`/admin/doctors/${doctor.id}`}
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
