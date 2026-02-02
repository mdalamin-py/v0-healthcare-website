import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Stethoscope,
  Heart,
  Activity,
  Brain,
  MessageSquare,
  Users,
  Pill,
  Utensils,
  Home,
  Phone,
  ArrowRight,
  CheckCircle,
  Shield
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Services | Dignity Home Health Care",
  description: "Comprehensive home health services including skilled nursing, physical therapy, occupational therapy, speech therapy, personal care, and more in Fresno, CA.",
}

const services = [
  {
    icon: Stethoscope,
    title: "Skilled Nursing Care",
    description: "Our registered nurses provide comprehensive medical care in your home, ensuring professional healthcare without hospital visits.",
    features: [
      "Wound care and dressing changes",
      "IV therapy and injections",
      "Chronic disease management",
      "Post-surgical care",
      "Health monitoring and assessments",
      "Patient and family education",
    ],
  },
  {
    icon: Activity,
    title: "Physical Therapy",
    description: "Our licensed physical therapists help restore mobility, strength, and function after illness, injury, or surgery.",
    features: [
      "Mobility and gait training",
      "Balance and fall prevention",
      "Strength and conditioning",
      "Pain management techniques",
      "Post-surgical rehabilitation",
      "Home exercise programs",
    ],
  },
  {
    icon: Brain,
    title: "Occupational Therapy",
    description: "Our occupational therapists help patients regain independence in daily activities and improve quality of life.",
    features: [
      "Activities of daily living training",
      "Home safety assessments",
      "Cognitive rehabilitation",
      "Adaptive equipment training",
      "Fine motor skill development",
      "Energy conservation techniques",
    ],
  },
  {
    icon: MessageSquare,
    title: "Speech Therapy",
    description: "Our speech-language pathologists address communication and swallowing disorders to improve safety and quality of life.",
    features: [
      "Speech and language therapy",
      "Swallowing assessments",
      "Cognitive-communication therapy",
      "Voice therapy",
      "Aphasia treatment",
      "Dysphagia management",
    ],
  },
  {
    icon: Heart,
    title: "Personal Care Services",
    description: "Our compassionate caregivers assist with daily activities while maintaining dignity and independence.",
    features: [
      "Bathing and personal hygiene",
      "Dressing assistance",
      "Grooming and toileting",
      "Mobility assistance",
      "Transferring and positioning",
      "Incontinence care",
    ],
  },
  {
    icon: Users,
    title: "Companion Care",
    description: "Our companions provide social interaction and emotional support to combat isolation and loneliness.",
    features: [
      "Friendly conversation",
      "Accompaniment to appointments",
      "Light housekeeping",
      "Meal preparation",
      "Medication reminders",
      "Recreational activities",
    ],
  },
  {
    icon: Pill,
    title: "Medication Management",
    description: "Our team ensures safe and proper medication administration while coordinating with your healthcare providers.",
    features: [
      "Medication administration",
      "Medication reconciliation",
      "Side effect monitoring",
      "Pharmacy coordination",
      "Medication education",
      "Compliance monitoring",
    ],
  },
  {
    icon: Utensils,
    title: "Nutrition Services",
    description: "Our nutritional support helps patients maintain proper nutrition for optimal health and recovery.",
    features: [
      "Nutritional assessments",
      "Dietary planning",
      "Special diet management",
      "Meal preparation guidance",
      "Feeding assistance",
      "Hydration monitoring",
    ],
  },
  {
    icon: Home,
    title: "Medical Social Work",
    description: "Our social workers help patients and families navigate healthcare systems and access community resources.",
    features: [
      "Care coordination",
      "Resource referrals",
      "Counseling services",
      "Advance care planning",
      "Insurance navigation",
      "Family support",
    ],
  },
]

const insuranceProviders = [
  "Medicare",
  "Medicaid / Medi-Cal",
  "Blue Cross Blue Shield",
  "Aetna",
  "United Healthcare",
  "Cigna",
  "Kaiser Permanente",
  "Humana",
]

export default function ServicesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight text-balance">
              Comprehensive Home Health Services
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              At Dignity Home Health Care, we offer a full range of healthcare services delivered 
              by skilled professionals in the comfort of your home. Our personalized approach ensures 
              you receive the care you need while maintaining your independence and dignity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <a href="tel:+15593751234">
                  <Phone className="size-5" />
                  Call for Free Consultation
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Request Services
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Healthcare Services
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We provide a comprehensive range of services tailored to meet your unique healthcare needs. 
              Each service is delivered by qualified, compassionate professionals.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.title} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <service.icon className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="size-4 text-accent mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              How to Get Started
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Beginning home health care services is simple. Here is how the process works.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Contact Us",
                description: "Call us or fill out our contact form. We will answer your questions and discuss your needs.",
              },
              {
                step: "2",
                title: "Assessment",
                description: "Our care coordinator will visit to assess needs and create a personalized care plan.",
              },
              {
                step: "3",
                title: "Care Team",
                description: "We match you with qualified caregivers who fit your needs and preferences.",
              },
              {
                step: "4",
                title: "Begin Care",
                description: "Your care begins with ongoing monitoring and adjustments as needed.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="py-16 lg:py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="size-6 text-primary" />
                <span className="font-semibold text-primary">Insurance Coverage</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                We Accept Most Major Insurance Plans
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Dignity Home Health Care is certified by Medicare and Medicaid and works with 
                most major insurance providers. Our team will help verify your benefits and 
                handle insurance paperwork so you can focus on your health.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Not sure if your insurance covers home health care? Contact us for a free 
                benefits verification. Many patients qualify for coverage they are not aware of.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="font-semibold text-lg text-foreground mb-4">Accepted Insurance Providers</h3>
              <div className="grid grid-cols-2 gap-3">
                {insuranceProviders.map((provider) => (
                  <div key={provider} className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-accent shrink-0" />
                    <span className="text-foreground text-sm">{provider}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-sm mt-4">
                And many more. Contact us to verify your coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Receiving Care at Home?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Contact us today for a free consultation. Our care coordinators will answer your 
            questions and help determine the right services for your needs.
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
                Request Services Online
                <ArrowRight className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
