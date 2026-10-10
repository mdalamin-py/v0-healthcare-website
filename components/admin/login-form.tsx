"use client"

import { AlertCircle, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormAction } from "@/components/admin/use-form-action"
import { signIn } from "@/app/admin/actions"

export function LoginForm({ initialError }: { initialError?: string }) {
  const { state, pending, form } = useFormAction(signIn, { error: initialError })

  return (
    <form {...form} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </div>
      {state.error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 w-full rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Sign in
      </Button>
    </form>
  )
}
