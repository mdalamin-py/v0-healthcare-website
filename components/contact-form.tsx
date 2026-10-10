"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { contactSchema, contactServices, patientRelations, type ContactInput } from "@/lib/validations/contact"
import { site } from "@/lib/site"

const defaultValues: ContactInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  patientRelation: "",
  service: "",
  message: "",
  company: "",
}

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success">("idle")
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues,
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        reset(defaultValues)
        setStatus("success")
        return
      }

      const data: { error?: string; fieldErrors?: Partial<Record<keyof ContactInput, string[]>> } = await response
        .json()
        .catch(() => ({}))

      for (const [field, messages] of Object.entries(data.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof ContactInput, { message: messages[0] })
      }
      setServerError(data.error ?? `Something went wrong. Please try again or call us at ${site.phone.display}.`)
    } catch {
      setServerError(`Network error. Please try again or call us at ${site.phone.display}.`)
    }
  })

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-12 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="size-8" />
        </span>
        <h3 className="mt-5 text-2xl font-bold text-foreground">Thank you!</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Your message has been sent. A care coordinator will contact you within 24 hours.
        </p>
        <Button className="mt-6 rounded-full" variant="outline" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    )
  }

  const fieldProps = (name: keyof ContactInput) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    ...register(name),
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input autoComplete="given-name" placeholder="John" className="h-11" {...fieldProps("firstName")} />
          <FieldError id="firstName-error" message={errors.firstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input autoComplete="family-name" placeholder="Doe" className="h-11" {...fieldProps("lastName")} />
          <FieldError id="lastName-error" message={errors.lastName?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="john@example.com"
            className="h-11"
            {...fieldProps("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input type="tel" autoComplete="tel" placeholder="(559) 123-4567" className="h-11" {...fieldProps("phone")} />
          <FieldError id="phone-error" message={errors.phone?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patientRelation">Relationship to patient</Label>
          <select className={selectClassName} {...fieldProps("patientRelation")}>
            <option value="">Select an option</option>
            {patientRelations.map((relation) => (
              <option key={relation.value} value={relation.value}>
                {relation.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="service">Service of interest</Label>
          <select className={selectClassName} {...fieldProps("service")}>
            <option value="">Select a service</option>
            {contactServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">How can we help? *</Label>
        <Textarea
          rows={5}
          className="min-h-32"
          placeholder="Tell us about your care needs or questions…"
          {...fieldProps("message")}
        />
        <FieldError id="message-error" message={errors.message?.message} />
      </div>

      {/* Honeypot field — hidden from people, attractive to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-12 w-full rounded-full shadow-lg shadow-primary/20"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Send message
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By submitting this form, you agree to our{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
        . Please don&apos;t include detailed medical information.
      </p>
    </form>
  )
}
