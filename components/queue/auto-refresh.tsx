"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

/** Re-renders the current server page on an interval while the tab is visible. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    setUpdatedAt(new Date())
    const refresh = () => {
      if (document.visibilityState !== "visible") return
      startTransition(() => router.refresh())
      setUpdatedAt(new Date())
    }
    const timer = setInterval(refresh, seconds * 1000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [router, seconds])

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => router.refresh())
        setUpdatedAt(new Date())
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      Live
      {updatedAt && ` · updated ${updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}`}
      <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
    </button>
  )
}
