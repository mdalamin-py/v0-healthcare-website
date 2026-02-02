import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Heart, 
  Target, 
  Eye,
  Users,
  Award,
  Shield,
  Phone,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Dignity Home Health Care",
  description: "Learn about Dignity Home Health Care's mission, values, and dedicated team of healthcare professionals serving Fresno, CA.",
}

const values = [
  {
    icon: Heart,
    title: "Compassion",
    description: "We treat every patient with kindness, empathy, and genuine care, understanding that each person has unique needs and circumstances.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description: "We uphold the highest ethical standards in all our interactions, maintaining transparency and honesty with patients and families.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive for excellence in every aspect of our care, continuously improving our services and staying current with best practices.",
  },
  {
    icon: Users,
    title: "Respect",
    description: "We honor the dignity and autonomy of every individual, respecting their choices, preferences, and cultural backgrounds.",
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
    description: "Experienced healthcare administrator ensuring seamless coordination between patients, families, and care teams.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
                About Dignity Home Health Care
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded with a commitment to providing exceptional home healthcare services, 
                Dignity Home Health Care has been serving the Fresno community with compassion 
                and professionalism. We believe that everyone deserves quality healthcare in 
                the comfort and familiarity of their own home.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our team of dedicated healthcare professionals works tirelessly to ensure that 
                each patient receives personalized care that promotes healing, independence, 
                and overall well-being. We are proud to be a trusted partner in the health 
                journey of countless families in our community.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/team-care.jpg"
                  alt="Our dedicated healthcare team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="size-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="size-7 text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To provide exceptional, compassionate home health care services that empower 
                  our patients to live their best lives in the comfort of their own homes. 
                  We are committed to delivering personalized care that respects the dignity, 
                  independence, and unique needs of every individual we serve.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="size-14 rounded-lg bg-accent/20 flex items-center justify-center mb-6">
                  <Eye className="size-7 text-accent" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Our Vision</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To be the most trusted home health care provider in the Central Valley, 
                  recognized for our unwavering commitment to quality, innovation, and 
                  patient-centered care. We envision a community where everyone has access 
                  to the healthcare they need to thrive at home.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Core Values
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These values guide everything we do at Dignity Home Health Care, 
              from how we care for patients to how we support each other as a team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="text-center border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="size-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Meet Our Leadership Team
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our experienced leadership team brings together decades of healthcare expertise, 
              united by a shared commitment to exceptional patient care.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="size-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Why Choose Dignity Home Health Care?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We understand that choosing a home health care provider is an important decision. 
                Here is what sets us apart and why families trust us with their loved ones care.
              </p>
              <ul className="space-y-4">
                {[
                  "Medicare, Medicaid, and most private insurances accepted",
                  "Comprehensive care coordination with your physicians",
                  "Flexible scheduling to meet your lifestyle needs",
                  "Bilingual staff fluent in English and Spanish",
                  "24/7 on-call support for emergencies",
                  "Locally owned and operated in Fresno",
                  "Background-checked and licensed caregivers",
                  "Personalized care plans for each patient",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary/5 rounded-2xl p-8">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-4">
                Our Service Area
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We proudly serve Fresno and the surrounding Central Valley communities, including:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["Fresno", "Clovis", "Madera", "Sanger", "Selma", "Reedley", "Kerman", "Coalinga"].map((city) => (
                  <div key={city} className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    <span className="text-foreground text-sm">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience the Dignity Difference?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Contact us today to learn more about our services and how we can help you or 
            your loved one receive the compassionate care you deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+15593751234">
                <Phone className="size-5" />
                Call (559) 375-1234
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent" asChild>
              <Link href="/contact">
                Contact Us Online
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
