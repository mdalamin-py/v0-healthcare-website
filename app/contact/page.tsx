"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Phone,
  MapPin,
  Mail,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    content: "(559) 375-1234",
    href: "tel:+15593751234",
    description: "Call us for immediate assistance",
  },
  {
    icon: MapPin,
    title: "Address",
    content: "1589 W Shaw Ave Ste 10\nFresno, CA 93711",
    href: "https://maps.google.com/?q=1589+W+Shaw+Ave+Ste+10,+Fresno,+CA+93711",
    description: "Visit our office",
  },
  {
    icon: Mail,
    title: "Email",
    content: "info@dignityhomehealthcare.com",
    href: "mailto:info@dignityhomehealthcare.com",
    description: "Send us an email",
  },
  {
    icon: Clock,
    title: "Hours",
    content: "Mon - Fri: 8:00 AM - 5:00 PM\n24/7 On-Call Available",
    description: "Office hours",
  },
]

const services = [
  "Skilled Nursing",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Personal Care",
  "Companion Care",
  "Other",
]

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  service: string
  message: string
  patientRelation: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  message?: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: "",
    patientRelation: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[\d\s\-()+ ]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number"
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          service: "",
          message: "",
          patientRelation: "",
        })
      } else {
        setSubmitStatus("error")
      }
    } catch {
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight text-balance">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ready to learn more about our home health care services? We are here to answer 
              your questions and help you find the right care solution for you or your loved one. 
              Contact us today for a free consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info) => (
              <Card key={info.title} className="border-border">
                <CardContent className="pt-6">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <info.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                  {info.href ? (
                    <a 
                      href={info.href}
                      target={info.href.startsWith("http") ? "_blank" : undefined}
                      rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-primary hover:text-primary/80 transition-colors whitespace-pre-line text-sm"
                    >
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-foreground whitespace-pre-line text-sm">{info.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we will get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitStatus === "success" ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="size-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                        <CheckCircle className="size-8 text-accent" />
                      </div>
                      <h3 className="font-semibold text-xl text-foreground mb-2">
                        Thank You!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Your message has been sent successfully. Our care coordinator will 
                        contact you within 24 hours.
                      </p>
                      <Button onClick={() => setSubmitStatus("idle")}>
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            aria-invalid={!!errors.firstName}
                          />
                          {errors.firstName && (
                            <p className="text-destructive text-sm flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            aria-invalid={!!errors.lastName}
                          />
                          {errors.lastName && (
                            <p className="text-destructive text-sm flex items-center gap-1">
                              <AlertCircle className="size-3" />
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(559) 123-4567"
                          aria-invalid={!!errors.phone}
                        />
                        {errors.phone && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="patientRelation">Relationship to Patient</Label>
                        <select
                          id="patientRelation"
                          name="patientRelation"
                          value={formData.patientRelation}
                          onChange={handleChange}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        >
                          <option value="">Select an option</option>
                          <option value="self">I am the patient</option>
                          <option value="spouse">Spouse/Partner</option>
                          <option value="child">Son/Daughter</option>
                          <option value="parent">Parent</option>
                          <option value="other-family">Other Family Member</option>
                          <option value="friend">Friend</option>
                          <option value="healthcare-provider">Healthcare Provider</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service">Service Interested In</Label>
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                        >
                          <option value="">Select a service</option>
                          {services.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Please tell us about your care needs or questions..."
                          rows={5}
                          aria-invalid={!!errors.message}
                        />
                        {errors.message && (
                          <p className="text-destructive text-sm flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            {errors.message}
                          </p>
                        )}
                      </div>

                      {submitStatus === "error" && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                          <AlertCircle className="size-5" />
                          <p className="text-sm">
                            Something went wrong. Please try again or call us directly.
                          </p>
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Send Message
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By submitting this form, you agree to our{" "}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        . We will never share your information.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-6">
              {/* Google Map */}
              <div className="rounded-2xl overflow-hidden border border-border h-80 lg:h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.4!2d-119.8!3d36.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s1589%20W%20Shaw%20Ave%20Ste%2010%2C%20Fresno%2C%20CA%2093711!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Dignity Home Health Care Location"
                />
              </div>

              {/* Quick Call Card */}
              <Card className="border-border bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-xl font-bold mb-2">
                    Prefer to Talk to Someone?
                  </h3>
                  <p className="text-primary-foreground/90 mb-4 text-sm leading-relaxed">
                    Our care coordinators are available to answer your questions and help you 
                    get started with home health care services.
                  </p>
                  <Button variant="secondary" size="lg" className="w-full" asChild>
                    <a href="tel:+15593751234">
                      <Phone className="size-5" />
                      Call (559) 375-1234
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* FAQ Quick Links */}
              <Card className="border-border">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg text-foreground mb-4">
                    Common Questions
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Do you accept Medicare/Medicaid?",
                      "How quickly can services start?",
                      "What areas do you serve?",
                      "How do I verify my insurance coverage?",
                    ].map((question) => (
                      <li key={question} className="flex items-start gap-2">
                        <CheckCircle className="size-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-sm">{question}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground text-sm mt-4">
                    Call us to get answers to all your questions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
