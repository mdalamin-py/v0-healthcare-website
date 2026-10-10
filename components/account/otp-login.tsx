"use client"

import { useState, useTransition } from "react"
import { AlertCircle, ArrowLeft, Loader2, Mail, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendOtp, verifyOtp } from "@/app/(site)/account/actions"
import type { OtpChannel } from "@/lib/validations/account"
import { cn } from "@/lib/utils"

const channels: { value: OtpChannel; label: string; icon: typeof Mail; placeholder: string; type: string }[] = [
  { value: "email", label: "Email", icon: Mail, placeholder: "you@example.com", type: "email" },
  { value: "phone", label: "Mobile", icon: Smartphone, placeholder: "(559) 123-4567", type: "tel" },
]

export function OtpLogin({ next, initialError }: { next?: string; initialError?: string }) {
  const [channel, setChannel] = useState<OtpChannel>("email")
  const [identifier, setIdentifier] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [pending, startTransition] = useTransition()

  const active = channels.find((item) => item.value === channel)!

  function requestCode(event?: React.FormEvent) {
    event?.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await sendOtp(channel, identifier)
      if (result.ok) {
        setSentTo(result.data.identifier)
        setToken("")
      } else {
        setError(result.error)
      }
    })
  }

  function confirmCode(event: React.FormEvent) {
    event.preventDefault()
    if (!sentTo) return
    setError(null)
    startTransition(async () => {
      const result = await verifyOtp(channel, sentTo, token, next)
      if (result && !result.ok) setError(result.error)
    })
  }

  return (
    <div>
      {!sentTo ? (
        <form onSubmit={requestCode} className="space-y-5">
          <div role="tablist" aria-label="Sign in with" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {channels.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={channel === item.value}
                onClick={() => {
                  setChannel(item.value)
                  setIdentifier("")
                  setError(null)
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                  channel === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="identifier">{channel === "email" ? "Email address" : "Mobile number"}</Label>
            <Input
              id="identifier"
              type={active.type}
              inputMode={channel === "phone" ? "tel" : "email"}
              autoComplete={channel === "email" ? "email" : "tel"}
              placeholder={active.placeholder}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              className="h-11"
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <Button type="submit" disabled={pending || !identifier} className="h-11 w-full rounded-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Send verification code
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            New here? We&apos;ll create your account automatically after you verify.
          </p>
        </form>
      ) : (
        <form onSubmit={confirmCode} className="space-y-5">
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Use a different {channel === "email" ? "email" : "number"}
          </button>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong className="text-foreground">{sentTo}</strong>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="token">Verification code</Label>
            <Input
              id="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))}
              className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
              autoFocus
            />
          </div>
          {error && <ErrorMessage message={error} />}
          <Button type="submit" disabled={pending || token.length !== 6} className="h-11 w-full rounded-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Verify & continue
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={() => requestCode()}
            className="w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      )}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  )
}
