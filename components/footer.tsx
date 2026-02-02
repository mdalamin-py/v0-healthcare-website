import Link from "next/link"
import { Heart, Phone, MapPin, Mail, Clock } from "lucide-react"

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/reviews", label: "Reviews" },
  { href: "/contact", label: "Contact" },
]

const services = [
  "Skilled Nursing",
  "Personal Care",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Medical Social Work",
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                <Heart className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg">Dignity</h3>
                <p className="text-xs text-background/70">Home Health Care</p>
              </div>
            </div>
            <p className="text-background/80 text-sm leading-relaxed">
              Providing compassionate, professional home health care services to the Fresno community. 
              Your health and dignity are our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-background/80 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Our Services</h4>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service} className="text-background/80 text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:+15593751234" 
                  className="flex items-start gap-3 text-background/80 hover:text-primary transition-colors text-sm"
                >
                  <Phone className="size-4 mt-0.5 shrink-0" />
                  <span>(559) 375-1234</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://maps.google.com/?q=1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-background/80 hover:text-primary transition-colors text-sm"
                >
                  <MapPin className="size-4 mt-0.5 shrink-0" />
                  <span>1589 W Shaw Ave Ste 10<br />Fresno, CA 93711</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@dignityhomehealthcare.com"
                  className="flex items-start gap-3 text-background/80 hover:text-primary transition-colors text-sm"
                >
                  <Mail className="size-4 mt-0.5 shrink-0" />
                  <span>info@dignityhomehealthcare.com</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-background/80 text-sm">
                <Clock className="size-4 mt-0.5 shrink-0" />
                <span>Mon - Fri: 8:00 AM - 5:00 PM<br />24/7 On-Call Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
          <p>&copy; {new Date().getFullYear()} Dignity Home Health Care. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/hipaa" className="hover:text-primary transition-colors">HIPAA Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
