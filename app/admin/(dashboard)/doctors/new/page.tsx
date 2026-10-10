import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DoctorForm } from "@/components/admin/doctor-form"
import { requireAdmin } from "@/lib/admin/auth"

export default async function NewDoctorPage() {
  await requireAdmin()

  return (
    <>
      <Link href="/admin/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />
        Doctors
      </Link>
      <AdminPageHeader title="Add doctor" description="You can add weekly sessions after creating the profile." />
      <DoctorForm />
    </>
  )
}
