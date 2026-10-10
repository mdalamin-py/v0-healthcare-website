"use client"

import { useState, useTransition } from "react"

type Outcome = { error?: string }

/** Runs a one-click admin action and keeps its error visible instead of failing silently. */
export function useAdminAction() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (action: () => Promise<Outcome>, onError?: () => void) =>
    startTransition(async () => {
      const result = await action().catch((): Outcome => ({ error: "Something went wrong. Please try again." }))
      setError(result.error ?? null)
      if (result.error) onError?.()
    })

  return { pending, error, run }
}
