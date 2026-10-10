"use client"

import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldMessage, FormStatus } from "@/components/admin/form-status"
import { useFormAction } from "@/components/admin/use-form-action"
import { saveFacility } from "@/app/admin/actions"
import { facilityTypes } from "@/lib/clinic/facilities"
import type { FacilityType, NearbyFacility } from "@/lib/supabase/types"

const select =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function FacilityForm({ facility, onSaved }: { facility?: NearbyFacility; onSaved?: () => void }) {
  const { state, pending, form } = useFormAction(async (prev, formData) => {
    const result = await saveFacility(facility?.id ?? null, prev, formData)
    if (result.success) onSaved?.()
    return result
  }, {})
  const errors = state.fieldErrors ?? {}
  const field = (name: keyof NearbyFacility) => `${facility?.id ?? "new"}-${name}`

  return (
    <form {...form} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={field("name")}>Name</Label>
          <Input id={field("name")} name="name" defaultValue={facility?.name} required />
          <FieldMessage messages={errors.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("type")}>Type</Label>
          <select id={field("type")} name="type" defaultValue={facility?.type ?? "hospital"} className={select}>
            {(Object.keys(facilityTypes) as FacilityType[]).map((type) => (
              <option key={type} value={type}>
                {facilityTypes[type].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={field("address")}>Address</Label>
          <Input id={field("address")} name="address" defaultValue={facility?.address} required />
          <FieldMessage messages={errors.address} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("city")}>City</Label>
          <Input id={field("city")} name="city" defaultValue={facility?.city} required />
          <FieldMessage messages={errors.city} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("phone")}>Phone</Label>
          <Input id={field("phone")} name="phone" type="tel" defaultValue={facility?.phone ?? ""} />
          <FieldMessage messages={errors.phone} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("latitude")}>Latitude</Label>
          <Input id={field("latitude")} name="latitude" inputMode="decimal" defaultValue={facility?.latitude} required />
          <FieldMessage messages={errors.latitude} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("longitude")}>Longitude</Label>
          <Input id={field("longitude")} name="longitude" inputMode="decimal" defaultValue={facility?.longitude} required />
          <FieldMessage messages={errors.longitude} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={field("services")}>Services (comma separated)</Label>
          <Input id={field("services")} name="services" defaultValue={facility?.services.join(", ")} placeholder="Emergency, X-ray, Lab tests" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={field("hours")}>Hours</Label>
          <Input id={field("hours")} name="hours" defaultValue={facility?.hours ?? ""} placeholder="Daily 8 AM – 8 PM" />
        </div>
        <div className="space-y-1.5 sm:col-span-3">
          <Label htmlFor={field("website")}>Website</Label>
          <Input id={field("website")} name="website" type="url" defaultValue={facility?.website ?? ""} placeholder="https://" />
          <FieldMessage messages={errors.website} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {(
          [
            ["has_emergency", "Emergency room", facility?.has_emergency ?? false],
            ["open_24h", "Open 24/7", facility?.open_24h ?? false],
            ["is_active", "Show on website", facility?.is_active ?? true],
          ] as const
        ).map(([name, label, checked]) => (
          <label key={name} className="inline-flex items-center gap-2">
            <input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-primary" />
            {label}
          </label>
        ))}
      </div>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {facility ? "Save facility" : "Add facility"}
      </Button>
    </form>
  )
}
