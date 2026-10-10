export const site = {
  name: "Dignity Home Health Care",
  shortName: "Dignity",
  tagline: "Compassionate Care, Right at Home",
  description:
    "Professional, compassionate home health services in Fresno, CA. Skilled nursing, personal care, and therapy services delivered in the comfort of your home.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dignityhomehealthcare.com",
  phone: {
    display: "(559) 375-1234",
    href: "tel:+15593751234",
  },
  email: "info@dignityhomehealthcare.com",
  address: {
    street: "1589 W Shaw Ave Ste 10",
    city: "Fresno",
    region: "CA",
    postalCode: "93711",
    country: "US",
    mapsUrl: "https://maps.google.com/?q=1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711",
  },
  hours: {
    office: "Mon – Fri: 8:00 AM – 5:00 PM",
    onCall: "24/7 On-Call Available",
  },
  rating: { value: "4.9", count: "16+" },
} as const

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
] as const

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/hipaa", label: "HIPAA Notice" },
] as const

export const serviceAreas = [
  "Fresno",
  "Clovis",
  "Madera",
  "Sanger",
  "Selma",
  "Reedley",
  "Kerman",
  "Coalinga",
] as const

export const serviceNames = [
  "Skilled Nursing",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Personal Care",
  "Companion Care",
  "Medication Management",
  "Nutrition Services",
  "Medical Social Work",
] as const
