import { FloatingCallButton } from "@/components/floating-call-button"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { serviceAreas, site } from "@/lib/site"

const structuredData = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: "+1-559-375-1234",
  email: site.email,
  image: `${site.url}/opengraph-image`,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "17:00",
  },
  areaServed: serviceAreas.map((city) => ({ "@type": "City", name: `${city}, CA` })),
  aggregateRating: { "@type": "AggregateRating", ratingValue: site.rating.value, reviewCount: 16 },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <FloatingCallButton />
    </>
  )
}
