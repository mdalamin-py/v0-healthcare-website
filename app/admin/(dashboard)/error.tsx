"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className="flex flex-col items-center rounded-3xl border border-destructive/30 bg-card px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-foreground">This page couldn&apos;t load</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The database may be unreachable or a migration hasn&apos;t been applied yet. Try again, and check the Supabase
        project if it keeps happening.
      </p>
      <Button onClick={reset} className="mt-6 rounded-full">
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
