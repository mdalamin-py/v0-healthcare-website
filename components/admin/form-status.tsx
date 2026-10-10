import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { ActionState } from "@/app/admin/actions"

export function FormStatus({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        {state.error}
      </p>
    )
  }
  if (state.success) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
        <CheckCircle2 className="size-4 shrink-0" />
        {state.success}
      </p>
    )
  }
  return null
}

export function FieldMessage({ messages }: { messages?: string[] }) {
  if (!messages?.[0]) return null
  return <p className="text-xs text-destructive">{messages[0]}</p>
}
