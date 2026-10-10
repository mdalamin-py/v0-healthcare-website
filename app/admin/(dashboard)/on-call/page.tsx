import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { OnCallManager } from "@/components/admin/on-call-manager"
import { listAllDoctors, listUpcomingShifts } from "@/lib/admin/queries"

export default async function AdminOnCallPage() {
  const [doctors, shifts] = await Promise.all([listAllDoctors(), listUpcomingShifts(14)])

  return (
    <>
      <AdminPageHeader
        title="Duty roster"
        description="Schedule on-call, emergency and ward duty for consultants and interns. Shown live on the website."
      />
      <OnCallManager
        doctors={doctors.filter((doctor) => doctor.is_active).map(({ id, full_name, kind }) => ({ id, full_name, kind }))}
        shifts={shifts}
      />
    </>
  )
}
