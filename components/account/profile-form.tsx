"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveProfile } from "@/app/(site)/account/actions"
import type { Patient } from "@/lib/supabase/types"
import { profileSchema, type ProfileInput } from "@/lib/validations/account"

const control =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function ProfileForm({
  profile,
  defaults,
  next,
  submitLabel = "Save profile",
}: {
  profile: Patient | null
  defaults: { email?: string; phone?: string }
  next?: string
  submitLabel?: string
}) {
  const [status, setStatus] = useState<{ error?: string; saved?: boolean }>({})
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? defaults.phone ?? "",
      email: profile?.email ?? defaults.email ?? "",
      date_of_birth: profile?.date_of_birth ?? "",
      gender: profile?.gender ?? "",
      address: profile?.address ?? "",
    },
    mode: "onTouched",
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus({})
    const result = await saveProfile(values, next)
    setStatus(result?.ok === false ? { error: result.error } : { saved: true })
  })

  const field = (name: keyof ProfileInput) => ({
    id: name,
    "aria-invalid": errors[name] ? true : undefined,
    ...form.register(name),
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input autoComplete="name" className="h-11" {...field("full_name")} />
          {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input type="tel" autoComplete="tel" className="h-11" {...field("phone")} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input type="email" autoComplete="email" className="h-11" {...field("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of birth</Label>
          <Input type="date" className="h-11" {...field("date_of_birth")} />
          {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select className={control} {...field("gender")}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Home address</Label>
          <Input autoComplete="street-address" placeholder="Used for home visits" className="h-11" {...field("address")} />
        </div>
      </div>

      {status.error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {status.error}
        </p>
      )}
      {status.saved && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
          <CheckCircle2 className="size-4 shrink-0" />
          Profile saved.
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="h-11 rounded-full px-6">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {submitLabel}
      </Button>
    </form>
  )
}
