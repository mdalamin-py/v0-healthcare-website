import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Phone, 
  Heart, 
  Shield, 
  Users, 
  Clock, 
  Award,
  Star,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Activity,
  HandHeart
} from "lucide-react"

const services = [
  {
    icon: Stethoscope,
    title: "Skilled Nursing",
    description: "Licensed nurses provide medical care including wound care, medication management, and health monitoring.",
  },
  {
    icon: HandHeart,
    title: "Personal Care",
    description: "Assistance with daily activities like bathing, dressing, grooming, and mobility support.",
  },
  {
    icon: Activity,
    title: "Physical Therapy",
    description: "Rehabilitation services to help restore movement, strength, and function after illness or injury.",
  },
  {
    icon: Users,
    title: "Companion Care",
    description: "Friendly companionship, conversation, and emotional support to combat isolation.",
  },
]

const trustBadges = [
  { icon: Shield, label: "Medicare Certified" },
  { icon: Award, label: "State Licensed" },
  { icon: CheckCircle, label: "HIPAA Compliant" },
  { icon: Clock, label: "24/7 On-Call" },
]

const testimonials = [
  {
    name: "Maria G.",
    text: "Dignity Home Health Care has been a blessing for our family. The nurses are incredibly compassionate and professional. My mother looks forward to their visits every day.",
    rating: 5,
  },
  {
    name: "Robert T.",
    text: "After my surgery, the physical therapist from Dignity helped me regain my mobility. Their patience and expertise made all the difference in my recovery.",
    rating: 5,
  },
  {
    name: "Susan L.",
    text: "The caregivers treat my father with such dignity and respect. They truly live up to their name. I can finally have peace of mind knowing he's in good hands.",
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Star className="size-4 fill-current" />
                <span>4.9 Star Rating on Google</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Compassionate Care,<br />
                <span className="text-primary">Right at Home</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Dignity Home Health Care provides professional, personalized healthcare services 
                in the comfort of your own home. Serving Fresno and surrounding communities with 
                care that preserves your independence and dignity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <a href="tel:+15593751234">
                    <Phone className="size-5" />
                    Call (559) 375-1234
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/services">
                    Our Services
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 pt-4">
                {trustBadges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon className="size-4 text-primary" />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/hero-care.jpg"
                  alt="Caring nurse with elderly patient"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-accent flex items-center justify-center">
                    <Heart className="size-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">16+</p>
                    <p className="text-sm text-muted-foreground">Happy Families</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Healthcare Services
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We offer a comprehensive range of home health services designed to meet your unique needs 
              while keeping you comfortable in your own home.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.title} className="group hover:shadow-lg transition-shadow border-border">
                <CardContent className="pt-6">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <service.icon className="size-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/services">
                View All Services
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="/images/team-care.jpg"
                  alt="Our caring healthcare team"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Why Families Choose Dignity Home Health Care
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For years, we have been providing exceptional home healthcare services to the Fresno community. 
                Our commitment to quality care and patient dignity sets us apart.
              </p>
              <ul className="space-y-4">
                {[
                  "Experienced, licensed healthcare professionals",
                  "Personalized care plans tailored to your needs",
                  "Coordination with your physicians and specialists",
                  "Flexible scheduling including weekends",
                  "Bilingual staff (English & Spanish)",
                  "Medicare, Medicaid, and most insurances accepted",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/about">
                  Learn More About Us
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Families Say About Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our patients and their families trust us to provide compassionate, professional care. 
              Here is what some of them have to say.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="size-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed mb-4">{`"${testimonial.text}"`}</p>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/reviews">
                Read More Reviews
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Contact us today for a free consultation. Our care coordinators are available to discuss 
            your needs and create a personalized care plan for you or your loved one.
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
