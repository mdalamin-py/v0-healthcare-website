"use client"

import { useState } from "react"
import { Check, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { expectedEnd, formatClock, surgeryStatuses } from "@/lib/clinic/ot"
import type { OtBoardCase, SurgeryStatus } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const steps: SurgeryStatus[] = ["scheduled", "pre_op", "in_progress", "recovery", "completed"]

function CaseTracker({ item }: { item: OtBoardCase }) {
  const status = surgeryStatuses[item.status]
  const reached = steps.indexOf(item.status === "delayed" ? "scheduled" : item.status)
  const done = (index: number) => index < reached || item.status === "completed"

  return (
    <div role="status" className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Case {item.case_code}</p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">{status.label}</h3>
          <p className="mt-1 text-muted-foreground">{status.family}</p>
          {item.note && <p className="mt-2 text-sm font-medium text-foreground">Update: {item.note}</p>}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            {item.theatre_code} · {item.surgeon_name}
          </p>
          <p>
            {item.ended_at
              ? `Finished ${formatClock(item.ended_at)}`
              : item.started_at
                ? `Expected to finish ${formatClock(expectedEnd(item))}`
                : `Planned start ${formatClock(item.scheduled_at)}`}
          </p>
        </div>
      </div>
      {item.status !== "cancelled" && (
        <ol className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((step, index) => (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                  done(index) && "border-accent bg-accent text-white",
                  index === reached && !done(index) && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20",
                  index > reached && "border-border bg-card text-muted-foreground",
                )}
              >
                {done(index) ? <Check className="size-4" /> : index + 1}
              </span>
              <span className={cn("text-xs", index === reached ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {surgeryStatuses[step].label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function CaseBoard({ cases }: { cases: OtBoardCase[] }) {
  const [code, setCode] = useState("")
  const query = code.trim().toUpperCase().replace(/^S-?/, "S-")
  const tracked = query.length > 2 ? cases.find((item) => item.case_code === query) : undefined

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <label htmlFor="case-code" className="text-sm font-medium text-foreground">
          Track an operation
        </label>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="case-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Case code, e.g. S-1042"
            className="h-11 pl-9"
            autoComplete="off"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {query.length > 2 && !tracked ? "No operation today with that case code." : "The case code is on the family information slip."}
        </p>
      </div>

      {tracked && <CaseTracker item={tracked} />}

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {cases.map((item) => {
            const status = surgeryStatuses[item.status]
            return (
              <li
                key={item.case_code}
                data-case={item.case_code}
                className={cn("grid gap-2 px-5 py-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center", tracked?.case_code === item.case_code && "bg-primary/5")}
              >
                <p className="font-display text-lg font-bold text-foreground">{formatClock(item.scheduled_at)}</p>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {item.case_code} · {item.procedure}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.theatre_code} · {item.surgeon_name} ({item.surgeon_specialty}) · {item.duration_minutes} min
                    {item.note && ` · ${item.note}`}
                  </p>
                </div>
                <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold", status.className)}>{status.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
