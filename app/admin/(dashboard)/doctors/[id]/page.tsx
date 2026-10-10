import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DoctorForm } from "@/components/admin/doctor-form"
import { ScheduleManager } from "@/components/admin/schedule-manager"
import { LeaveManager } from "@/components/admin/leave-manager"
import { requireAdmin } from "@/lib/admin/auth"
import { clinicToday } from "@/lib/clinic/time"
import type { DoctorLeave } from "@/lib/supabase/types"
import { getDoctorForAdmin } from "@/lib/admin/queries"

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; contact?: string }> }

export default async function EditDoctorPage({ params, searchParams }: Props) {
  const [{ id }, { created, contact: contactStatus }] = await Promise.all([params, searchParams])
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const doctor = await getDoctorForAdmin(id)
  if (!doctor) notFound()

  const today = clinicToday()
  const { supabase } = await requireAdmin()
  const { data: contact } = await supabase.from("doctor_contacts").select("*").eq("doctor_id", doctor.id).maybeSingle()
  const { data: leaves } = await supabase
    .from("doctor_leaves")
    .select("*")
    .eq("doctor_id", doctor.id)
    .gte("leave_date", today)
    .order("leave_date")

  return (
    <>
      <Link href="/admin/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        Doctors
      </Link>
      <AdminPageHeader
        title={doctor.full_name}
        description={doctor.specialty}
        actions={
          doctor.is_active && (
            <Link
              href={`/doctors/${doctor.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View public profile
              <ExternalLink className="size-4" />
            </Link>
          )
        }
      />
      {created && (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          <CheckCircle2 className="size-4" />
          Doctor created. Add weekly sessions below so patients can book.
        </p>
      )}
      {contactStatus === "failed" && (
        <p role="alert" className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          The contact emails could not be saved. Please enter them again below.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <DoctorForm doctor={doctor} contact={contact} />
        </div>
        <div className="space-y-6 xl:col-span-2">
          <ScheduleManager doctorId={doctor.id} schedules={doctor.doctor_schedules} />
          <LeaveManager doctorId={doctor.id} leaves={(leaves ?? []) as DoctorLeave[]} today={today} />
        </div>
      </div>
    </>
  )
}
