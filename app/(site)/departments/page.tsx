import Link from "next/link"
import type { Metadata } from "next"
import { ArrowUpRight, Stethoscope } from "lucide-react"
import { CtaSection } from "@/components/cta-section"
import { PageHero } from "@/components/page-hero"
import { buildDepartments } from "@/lib/clinic/departments"
import { getDoctors } from "@/lib/clinic/queries"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Departments",
  description: "Explore our medical departments and specialties, and find the right doctor for your care.",
}

export default async function DepartmentsPage() {
  const departments = buildDepartments(await getDoctors())

  return (
    <>
      <PageHero
        eyebrow="Departments"
        title="Specialist care under one roof"
        description={
          <p>
            From everyday family medicine to cardiology and rehabilitation, our departments work together so you get
            coordinated care — in clinic or at home.
          </p>
        }
      />

      <section className="py-16 lg:py-20">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Link
              key={department.slug}
              href={`/departments/${department.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0" />
              <div className="relative flex items-start justify-between">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                  <department.icon className="size-7" />
                </span>
                <ArrowUpRight className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h2 className="relative mt-6 text-xl font-bold text-foreground">{department.name}</h2>
              <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{department.summary}</p>
              <p className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <Stethoscope className="size-4" />
                {department.doctors.length > 0
                  ? `${department.doctors.length} ${department.doctors.length === 1 ? "doctor" : "doctors"}`
                  : "Call to schedule"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection
        title="Not sure which department you need?"
        description="Our care coordinators will listen to your concerns and connect you with the right specialist."
      />
    </>
  )
}
