"use client"

import { useActionState, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FieldMessage, FormStatus } from "@/components/admin/form-status"
import { saveDoctor, type ActionState } from "@/app/admin/actions"
import type { Doctor } from "@/lib/supabase/types"

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/^dr\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function DoctorForm({ doctor }: { doctor?: Doctor }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveDoctor.bind(null, doctor?.id ?? null), {})
  const [slug, setSlug] = useState(doctor?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(doctor))
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name *</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={doctor?.full_name}
            required
            onChange={(event) => !slugTouched && setSlug(slugify(event.target.value))}
          />
          <FieldMessage messages={errors.full_name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL slug *</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            required
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(event.target.value)
            }}
          />
          <p className="text-xs text-muted-foreground">/doctors/{slug || "your-doctor"}</p>
          <FieldMessage messages={errors.slug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty *</Label>
          <Input id="specialty" name="specialty" defaultValue={doctor?.specialty} required />
          <FieldMessage messages={errors.specialty} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" name="qualification" defaultValue={doctor?.qualification ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience_years">Years of experience</Label>
          <Input id="experience_years" name="experience_years" type="number" min={0} max={80} defaultValue={doctor?.experience_years ?? 0} />
          <FieldMessage messages={errors.experience_years} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consultation_fee">Consultation fee (USD)</Label>
          <Input
            id="consultation_fee"
            name="consultation_fee"
            type="number"
            min={0}
            step="0.01"
            defaultValue={doctor?.consultation_fee ?? ""}
          />
          <FieldMessage messages={errors.consultation_fee} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="languages">Languages *</Label>
          <Input id="languages" name="languages" defaultValue={doctor?.languages.join(", ") ?? "English"} placeholder="English, Spanish" />
          <FieldMessage messages={errors.languages} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Room / location</Label>
          <Input id="room" name="room" defaultValue={doctor?.room ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="photo_url">Photo URL</Label>
          <Input id="photo_url" name="photo_url" type="url" defaultValue={doctor?.photo_url ?? ""} placeholder="https://…" />
          <FieldMessage messages={errors.photo_url} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Short bio</Label>
          <Textarea id="bio" name="bio" rows={4} defaultValue={doctor?.bio ?? ""} />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-foreground">
        <input type="checkbox" name="is_active" defaultChecked={doctor?.is_active ?? true} className="size-4 accent-primary" />
        Show this doctor on the website and allow bookings
      </label>

      <FormStatus state={state} />

      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {doctor ? "Save changes" : "Create doctor"}
      </Button>
    </form>
  )
}
