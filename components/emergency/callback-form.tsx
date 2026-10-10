"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { AlertCircle, CheckCircle2, Loader2, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestCallback, type CallbackInput } from "@/app/(site)/emergency/actions"

export function CallbackForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<CallbackInput>({ defaultValues: { name: "", phone: "", concern: "" } })
  const { isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    const result = await requestCallback(values)
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
          A nurse will call you back as soon as possible. If symptoms get worse, call 911 right away.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cb-name">Your name</Label>
          <Input id="cb-name" autoComplete="name" required className="h-11" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cb-phone">Phone number</Label>
          <Input id="cb-phone" type="tel" autoComplete="tel" required className="h-11" {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cb-concern">What&apos;s happening?</Label>
        <Textarea
          id="cb-concern"
          rows={3}
          required
          maxLength={500}
          className="min-h-24"
          placeholder="Briefly describe the symptoms or concern"
          {...form.register("concern")}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
        Request an urgent callback
      </Button>
    </form>
  )
}
