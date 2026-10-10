"use client"

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react"
import type { ActionState } from "@/app/admin/actions"

// React resets a form after every `action` submission, which wipes the user's
// input when validation fails. Submitting through onSubmit keeps the values and
// clears the form only once the action succeeds.
export function useFormAction(action: (state: ActionState, formData: FormData) => Promise<ActionState>, initial: ActionState = {}) {
  const [state, dispatch, pending] = useActionState(action, initial)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) ref.current?.reset()
  }, [state])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => dispatch(formData))
  }

  return { state, pending, form: { ref, onSubmit } }
}
