"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

type ServerActionFailure = { success: false; error: string }

type ServerActionResult =
  | ({ success: true } & Record<string, unknown>)
  | ServerActionFailure

type UseServerActionOptions<TResult extends ServerActionResult> = {
  onSuccess?: (result: Extract<TResult, { success: true }>) => void
  onError?: (error: string) => void
  successMessage?: string
}

export function useServerAction<TInput, TResult extends ServerActionResult>(
  action: (input: TInput) => Promise<TResult>,
  options: UseServerActionOptions<TResult> = {}
) {
  const [pending, setPending] = useState(false)
  const { onSuccess, onError, successMessage } = options

  const execute = useCallback(
    async (input: TInput) => {
      setPending(true)
      try {
        const result = await action(input)

        if (!result.success) {
          toast.error(result.error)
          onError?.(result.error)
          return result
        }

        if (successMessage) {
          toast.success(successMessage)
        }

        onSuccess?.(result as Extract<TResult, { success: true }>)
        return result
      } finally {
        setPending(false)
      }
    },
    [action, onSuccess, onError, successMessage]
  )

  return { execute, pending }
}
