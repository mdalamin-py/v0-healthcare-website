import type { Metadata } from "next"
import { Award, CheckCircle, Eye, Heart, MapPin, Shield, Target, Users } from "lucide-react"
import { CtaSection } from "@/components/cta-section"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { serviceAreas } from "@/lib/site"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Dignity Home Health Care's mission, values, and dedicated team of healthcare professionals serving Fresno, CA.",
}

const values = [
  {
    icon: Heart,
    title: "Compassion",
    description:
      "We treat every patient with kindness, empathy, and genuine care, understanding that each person has unique needs and circumstances.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "We uphold the highest ethical standards in all our interactions, maintaining transparency and honesty with patients and families.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "We strive for excellence in every aspect of our care, continuously improving our services and staying current with best practices.",
  },
  {
    icon: Users,
    title: "Respect",
    description:
      "We honor the dignity and autonomy of every individual, respecting their choices, preferences, and cultural backgrounds.",
  },
]

const team = [
  {
    name: "Dr. Sarah Johnson",
    role: "Medical Director",
    description: "Board-certified physician with over 20 years of experience in geriatric and home health care.",
  },
  {
    name: "Maria Rodriguez, RN",
    role: "Director of Nursing",
    description: "Registered nurse specializing in home health with a passion for patient-centered care.",
  },
  {
    name: "James Chen, PT",
    role: "Lead Physical Therapist",
    description: "Licensed physical therapist dedicated to helping patients regain mobility and independence.",
  },
  {
    name: "Lisa Thompson",
    role: "Care Coordinator",
    description:
      "Experienced healthcare administrator ensuring seamless coordination between patients, families, and care teams.",
  },
]

const differentiators = [
  "Medicare, Medicaid, and most private insurances accepted",
  "Comprehensive care coordination with your physicians",
  "Flexible scheduling to meet your lifestyle needs",
  "Bilingual staff fluent in English and Spanish",
  "24/7 on-call support for emergencies",
  "Locally owned and operated in Fresno",
  "Background-checked and licensed caregivers",
  "Personalized care plans for each patient",
]

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(",")[0]
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Care rooted in compassion and dignity"
        description={
          <>
            <p>
              Dignity Home Health Care has been serving the Fresno community with compassion and professionalism. We
              believe everyone deserves quality healthcare in the comfort and familiarity of their own home.
            </p>
            <p className="text-base">
              Our dedicated professionals deliver personalized care that promotes healing, independence, and overall
              well-being — and we are proud to be a trusted partner in the health journey of families across our
              community.
            </p>
          </>
        }
        image={{ src: "/images/team-care.jpg", alt: "The Dignity Home Health Care team" }}
      />

      {/* Mission & vision */}
      <section className="py-16 lg:py-24">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Target,
              title: "Our Mission",
              body: "To provide exceptional, compassionate home health care services that empower our patients to live their best lives in the comfort of their own homes — with personalized care that respects the dignity, independence, and unique needs of every individual we serve.",
            },
            {
              icon: Eye,
              title: "Our Vision",
              body: "To be the most trusted home health care provider in the Central Valley, recognized for our unwavering commitment to quality, innovation, and patient-centered care — a community where everyone can access the healthcare they need to thrive at home.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm lg:p-10"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                <item.icon className="size-7" />
              </span>
              <h2 className="relative mt-6 text-2xl font-bold text-foreground">{item.title}</h2>
              <p className="relative mt-4 leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our Values"
            title="The principles behind our care"
            description="These values guide everything we do — from how we care for patients to how we support each other as a team."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <value.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Leadership"
            title="Meet our leadership team"
            description="Decades of combined healthcare expertise, united by a shared commitment to exceptional patient care."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <article
                key={member.name}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-2xl font-bold text-white ring-4 ring-primary/10">
                  {initials(member.name)}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why us & service area */}
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              align="left"
              eyebrow="Why Dignity"
              title="What sets us apart"
              description="Choosing a home health care provider is an important decision. Here is why families trust us with their loved ones' care."
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {differentiators.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-slate-300 lg:col-span-5 lg:self-start">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <MapPin className="size-6" />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-white">Our service area</h3>
              <p className="mt-3 leading-relaxed">
                We proudly serve Fresno and the surrounding Central Valley communities.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {serviceAreas.map((city) => (
                  <li
                    key={city}
                    className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection
        title="Ready to experience the Dignity difference?"
        description="Contact us today to learn how we can help you or your loved one receive the compassionate care you deserve."
      />
    </>
  )
}
