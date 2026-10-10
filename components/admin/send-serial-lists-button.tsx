"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail } from "lucide-react"
import { sendSerialListsNow } from "@/app/admin/actions"
import type { DigestResult } from "@/lib/digest"
import { cn } from "@/lib/utils"

export function SendSerialListsButton() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [results, setResults] = useState<DigestResult[]>([])

  return (
    <div className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const response = await sendSerialListsNow()
            setMessage(response.error ?? response.success ?? null)
            setResults(response.results ?? [])
          })
        }
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        Email today&apos;s serial lists
      </button>
      {message && (
        <div role="status" className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-border bg-popover p-4 text-sm shadow-xl">
          <p className="font-medium text-foreground">{message}</p>
          {results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((result) => (
                <li key={result.doctor} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-foreground">
                    {result.doctor}
                    <span className="block text-muted-foreground">
                      {result.appointments} patients{result.reason ? ` · ${result.reason}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium capitalize",
                      result.status === "sent" ? "bg-accent/15 text-accent" : result.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {result.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setMessage(null)} className="mt-3 text-xs font-medium text-primary hover:underline">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
