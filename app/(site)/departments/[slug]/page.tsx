import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, CalendarPlus, CheckCircle2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DoctorCard } from "@/components/doctors/doctor-card"
import { buildDepartments } from "@/lib/clinic/departments"
import { clinicWeekday } from "@/lib/clinic/format"
import { getDoctors } from "@/lib/clinic/queries"
import { fill } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/server"
import { site } from "@/lib/site"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

async function getDepartment(slug: string) {
  const [doctors, t] = await Promise.all([getDoctors(), getDictionary()])
  return buildDepartments(doctors, t).find((department) => department.slug === slug) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const department = await getDepartment((await params).slug)
  if (!department) return { title: (await getDictionary()).departmentsPage.notFound }
  return { title: department.name, description: department.summary }
}

export default async function DepartmentPage({ params }: Props) {
  const department = await getDepartment((await params).slug)
  if (!department) notFound()
  const t = await getDictionary()
  const p = t.departmentsPage

  const today = clinicWeekday()
  const bookHref =
    department.doctors.length === 1 ? `/appointments/book?doctor=${department.doctors[0].slug}` : "/appointments/book"

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[420px] rounded-full bg-accent/15 blur-3xl" />
        <div className="container-page relative py-12 lg:py-20">
          <Link
            href="/departments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            {p.allDepartments}
          </Link>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/25">
                <department.icon className="size-8" />
              </span>
              <h1 className="mt-6 text-4xl font-extrabold text-foreground md:text-5xl">{department.name}</h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{department.description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-7 shadow-lg shadow-primary/25">
                <Link href={bookHref}>
                  <CalendarPlus className="size-5" />
                  {t.common.bookAppointment}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full bg-card/70 px-7">
                <a href={site.phone.href}>
                  <Phone className="size-5" />
                  {site.phone.display}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {(department.conditions.length > 0 || department.services.length > 0) && (
        <section className="py-14">
          <div className="container-page grid gap-6 md:grid-cols-2">
            {[
              { title: p.conditions, items: department.conditions },
              { title: p.services, items: department.services },
            ]
              .filter((block) => block.items.length > 0)
              .map((block) => (
                <div key={block.title} className="rounded-3xl border border-border bg-card p-7 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground">{block.title}</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="bg-muted/40 py-14 lg:py-20">
        <div className="container-page">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{fill(p.doctorsHeading, { name: department.name })}</h2>
          {department.doctors.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {department.doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} today={today} />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground">
              {fill(p.callToArrange, { phone: site.phone.display, name: department.name })}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
