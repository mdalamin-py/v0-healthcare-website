"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { AlertCircle, Ambulance, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestAmbulance, type AmbulanceRequestInput } from "@/app/(site)/ambulance/actions"

export function AmbulanceRequestForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<AmbulanceRequestInput>({ defaultValues: { name: "", phone: "", address: "", details: "" } })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    const result = await requestAmbulance(values)
    if (result.ok) setDone(true)
    else setError(result.error)
  })

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="mt-4 text-xl font-bold text-foreground">Request received</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Our dispatcher will call you shortly to confirm the pickup time and ambulance.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amb-name">Patient name</Label>
          <Input id="amb-name" required className="h-11" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amb-phone">Contact phone</Label>
          <Input id="amb-phone" type="tel" required className="h-11" {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amb-address">Pickup address</Label>
        <Input id="amb-address" autoComplete="street-address" required className="h-11" {...form.register("address")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amb-details">Details (optional)</Label>
        <Textarea
          id="amb-details"
          rows={3}
          maxLength={500}
          placeholder="Destination, mobility needs, oxygen, preferred time…"
          className="min-h-24"
          {...form.register("details")}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting} className="h-11 w-full rounded-full">
        {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Ambulance className="size-4" />}
        Request an ambulance
      </Button>
    </form>
  )
}
