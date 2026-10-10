"use client"

import { useActionState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldMessage, FormStatus } from "@/components/admin/form-status"
import { saveAmbulance, type ActionState } from "@/app/admin/actions"
import { ambulanceStatuses, ambulanceTypes } from "@/lib/clinic/ambulance"
import type { Ambulance, AmbulanceStatus, AmbulanceType } from "@/lib/supabase/types"

const select =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function AmbulanceForm({ ambulance, onSaved }: { ambulance?: Ambulance; onSaved?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await saveAmbulance(ambulance?.id ?? null, prev, formData)
    if (result.success) onSaved?.()
    return result
  }, {})
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" defaultValue={ambulance?.code} placeholder="AMB-06" required />
          <FieldMessage messages={errors.code} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registration">Registration</Label>
          <Input id="registration" name="registration" defaultValue={ambulance?.registration} required />
          <FieldMessage messages={errors.registration} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle_model">Model</Label>
          <Input id="vehicle_model" name="vehicle_model" defaultValue={ambulance?.vehicle_model} required />
          <FieldMessage messages={errors.vehicle_model} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" defaultValue={ambulance?.type ?? "bls"} className={select}>
            {(Object.keys(ambulanceTypes) as AmbulanceType[]).map((type) => (
              <option key={type} value={type}>
                {ambulanceTypes[type].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={ambulance?.status ?? "available"} className={select}>
            {(Object.keys(ambulanceStatuses) as AmbulanceStatus[]).map((status) => (
              <option key={status} value={status}>
                {ambulanceStatuses[status].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="driver_name">Driver</Label>
          <Input id="driver_name" name="driver_name" defaultValue={ambulance?.driver_name ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="equipment">Equipment (comma separated)</Label>
          <Input id="equipment" name="equipment" defaultValue={ambulance?.equipment.join(", ")} placeholder="Oxygen, AED, Stretcher" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="base_location">Base</Label>
          <Input id="base_location" name="base_location" defaultValue={ambulance?.base_location ?? ""} />
        </div>
      </div>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {ambulance ? "Save ambulance" : "Add ambulance"}
      </Button>
    </form>
  )
}
