import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Star,
  Quote,
  Phone,
  ArrowRight,
  MapPin,
  ExternalLink
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Patient Reviews | Dignity Home Health Care",
  description: "Read what our patients and their families say about Dignity Home Health Care. 4.9 star rating with 16+ reviews in Fresno, CA.",
}

const reviews = [
  {
    name: "Maria G.",
    date: "2 months ago",
    rating: 5,
    text: "Dignity Home Health Care has been a blessing for our family. The nurses are incredibly compassionate and professional. My mother looks forward to their visits every day. They treat her with such respect and genuine care. I cannot recommend them enough to anyone looking for quality home health care in Fresno.",
    service: "Skilled Nursing",
  },
  {
    name: "Robert T.",
    date: "3 months ago",
    rating: 5,
    text: "After my hip replacement surgery, the physical therapist from Dignity helped me regain my mobility. Their patience and expertise made all the difference in my recovery. Within weeks, I was walking again with confidence. The team was always on time and very professional.",
    service: "Physical Therapy",
  },
  {
    name: "Susan L.",
    date: "1 month ago",
    rating: 5,
    text: "The caregivers treat my father with such dignity and respect. They truly live up to their name. I can finally have peace of mind knowing he is in good hands. The staff is well-trained, kind, and always goes above and beyond. Thank you for giving our family such excellent care.",
    service: "Personal Care",
  },
  {
    name: "James M.",
    date: "4 months ago",
    rating: 5,
    text: "Outstanding service from start to finish. The intake process was smooth, and they matched us with a wonderful caregiver who has become like family. My wife receives excellent care, and I appreciate how they keep me informed about her progress. Five stars all around!",
    service: "Companion Care",
  },
  {
    name: "Patricia H.",
    date: "2 weeks ago",
    rating: 5,
    text: "I was hesitant about home health care at first, but Dignity has exceeded all my expectations. The nursing staff is top-notch, and they coordinate perfectly with my doctors. Having professional care at home has made managing my diabetes so much easier.",
    service: "Skilled Nursing",
  },
  {
    name: "Michael R.",
    date: "1 month ago",
    rating: 5,
    text: "My mother had a stroke and needed speech therapy. The speech therapist from Dignity was patient, encouraging, and skilled. Mom has made remarkable progress in her communication abilities. We are so grateful for their dedication and expertise.",
    service: "Speech Therapy",
  },
  {
    name: "Jennifer K.",
    date: "3 weeks ago",
    rating: 5,
    text: "The occupational therapist helped my dad learn to dress himself again after his stroke. Small victories like this mean the world to us. The entire team at Dignity is compassionate and truly cares about their patients quality of life.",
    service: "Occupational Therapy",
  },
  {
    name: "David S.",
    date: "2 months ago",
    rating: 4,
    text: "Very professional and caring staff. They helped my grandmother with her daily activities while I was at work. The only reason I am giving 4 stars instead of 5 is because scheduling was a bit challenging at first, but once we got into a routine, everything was perfect.",
    service: "Personal Care",
  },
  {
    name: "Linda W.",
    date: "5 months ago",
    rating: 5,
    text: "Dignity Home Health Care provided excellent care for my husband during his cancer treatment. The nurses were knowledgeable, compassionate, and always available when we had questions. They made a difficult time much more manageable for our entire family.",
    service: "Skilled Nursing",
  },
  {
    name: "Thomas B.",
    date: "1 month ago",
    rating: 5,
    text: "I am so impressed with the level of care my mother receives. The caregivers are not just employees they genuinely care about her wellbeing. They remember her preferences, engage her in conversation, and treat her like family. Cannot thank them enough!",
    service: "Companion Care",
  },
  {
    name: "Angela C.",
    date: "6 weeks ago",
    rating: 5,
    text: "The physical therapy team helped me recover from knee surgery faster than I expected. They were motivating, professional, and always on time. My surgeon was impressed with my progress. Highly recommend their rehabilitation services!",
    service: "Physical Therapy",
  },
  {
    name: "Richard N.",
    date: "4 weeks ago",
    rating: 5,
    text: "From the first phone call, I knew Dignity was different. They took the time to understand our needs and matched us with the perfect caregiver. My dad is happier and healthier thanks to their excellent care. They truly embody their name.",
    service: "Personal Care",
  },
]

const stats = [
  { value: "4.9", label: "Star Rating" },
  { value: "16+", label: "Reviews" },
  { value: "100%", label: "Would Recommend" },
  { value: "5+", label: "Years Serving Fresno" },
]

export default function ReviewsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-8 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              What Our Patients Say
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              With a 4.9 star rating and over 16 reviews, families in Fresno trust Dignity Home Health Care 
              to provide compassionate, professional care for their loved ones.
            </p>
            <a 
              href="https://www.google.com/maps/place/1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <MapPin className="size-4" />
              View on Google Maps
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{review.name}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <Quote className="size-6 text-primary/20" />
                  </div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - review.rating }).map((_, i) => (
                      <Star key={i} className="size-4 text-muted-foreground/30" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed text-sm mb-3">
                    {`"${review.text}"`}
                  </p>
                  <div className="inline-flex items-center px-2 py-1 bg-primary/10 rounded text-xs text-primary font-medium">
                    {review.service}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leave a Review CTA */}
      <section className="py-16 lg:py-24 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Are You a Current or Former Patient?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            We would love to hear about your experience with Dignity Home Health Care. 
            Your feedback helps us improve and helps other families find quality care.
          </p>
          <Button size="lg" asChild>
            <a 
              href="https://www.google.com/maps/place/1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Leave a Review on Google
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Experience the Care Everyone is Talking About
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the many families who trust Dignity Home Health Care. Contact us today 
            for a free consultation and discover why we are rated 4.9 stars.
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
