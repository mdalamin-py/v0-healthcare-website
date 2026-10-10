"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitApplication } from "@/app/(site)/doctor-portal/actions"
import { doctorApplicationSchema, type DoctorApplicationInput } from "@/lib/validations/doctor-application"

export function RegistrationForm({ defaults }: { defaults: Partial<DoctorApplicationInput> }) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<DoctorApplicationInput>({
    resolver: zodResolver(doctorApplicationSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      specialty: "",
      qualification: "",
      license_number: "",
      experience_years: 0,
      languages: "English",
      bio: "",
      ...defaults,
    },
    mode: "onTouched",
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    const result = await submitApplication(values)
    if (result.error) setError(result.error)
  })

  const field = (name: keyof DoctorApplicationInput) => ({
    id: `reg-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    ...form.register(name),
  })
  const message = (name: keyof DoctorApplicationInput) =>
    errors[name]?.message ? <p className="text-sm text-destructive">{errors[name]?.message}</p> : null

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="reg-full_name">Full name *</Label>
          <Input autoComplete="name" placeholder="Nadia Karim" className="h-11" {...field("full_name")} />
          {message("full_name")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-specialty">Specialty *</Label>
          <Input placeholder="Cardiology" className="h-11" {...field("specialty")} />
          {message("specialty")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-qualification">Qualifications *</Label>
          <Input placeholder="MBBS, FCPS (Medicine)" className="h-11" {...field("qualification")} />
          {message("qualification")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-license_number">Medical license number *</Label>
          <Input className="h-11 uppercase" {...field("license_number")} />
          {message("license_number")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-experience_years">Years of experience *</Label>
          <Input type="number" inputMode="numeric" min={0} max={80} className="h-11" {...field("experience_years")} />
          {message("experience_years")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-phone">Phone *</Label>
          <Input type="tel" autoComplete="tel" placeholder="(559) 123-4567" className="h-11" {...field("phone")} />
          {message("phone")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-languages">Languages *</Label>
          <Input placeholder="English, Spanish" className="h-11" {...field("languages")} />
          {message("languages")}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="reg-bio">Short bio</Label>
          <Textarea rows={4} className="min-h-28" placeholder="Your clinical focus and experience — shown on your public profile." {...field("bio")} />
          {message("bio")}
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 w-full rounded-full">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Submit registration
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        The clinic verifies your license before your profile goes live. You&apos;ll then manage bookings and days off here.
      </p>
    </form>
  )
}
