'use client'

import { useCallback, useState } from 'react'
import { apiPaths } from '@/app/paths'
import {
  mapWorkflowStreamChunk,
  type WorkflowStreamChunk,
} from '../lib/workflow-stream'
import type { StepRunStatus } from '../types'

export type UseWorkflowRunOptions = {
  workflowId: string
  canRun: boolean
}

export type WorkflowRunInput = {
  inputKeys: string[]
  inputData: Record<string, string>
}

export function useWorkflowRun({ workflowId, canRun }: UseWorkflowRunOptions) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepRunStatus>>({})

  const reset = useCallback(() => {
    setResult(null)
    setRunError(null)
  }, [])

  const run = useCallback(
    async ({ inputKeys, inputData }: WorkflowRunInput) => {
      if (!canRun) return
      setRunning(true)
      setStepStatuses({})
      setResult(null)
      setRunError(null)

      const body =
        inputKeys.length > 0
          ? {
              inputData: Object.fromEntries(
                inputKeys.map((key) => [key, inputData[key] ?? ''])
              ),
            }
          : {}
      let streamResult: unknown | undefined

      const dispatchEvent = (event: unknown) => {
        const statusChunk = mapWorkflowStreamChunk(event)
        if (statusChunk) {
          const { stepId } = statusChunk
          if (statusChunk.type === 'step-start') {
            setStepStatuses((p) => ({ ...p, [stepId]: 'running' }))
          } else if (statusChunk.type === 'step-complete') {
            setStepStatuses((p) => ({ ...p, [stepId]: 'success' }))
          } else {
            setStepStatuses((p) => ({ ...p, [stepId]: 'error' }))
          }
          return
        }

        if (!event || typeof event !== 'object') return
        const chunk = event as WorkflowStreamChunk
        if (chunk.type === 'workflow-result') {
          streamResult = chunk.result
        } else if (chunk.type === 'error') {
          setRunError(chunk.message ?? 'Unknown error')
        }
      }

      try {
        const res = await fetch(apiPaths.workflowRun(workflowId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null
          setRunError(j?.error ?? `Request failed (${res.status})`)
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setRunError('No response body')
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          buffer += decoder.decode(value, { stream: !done })
          const lines = buffer.split('\n')
          buffer = done ? '' : (lines.pop() ?? '')

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              dispatchEvent(JSON.parse(trimmed) as unknown)
            } catch {
              continue
            }
          }
          if (done) break
        }

        const tail = buffer.trim()
        if (tail) {
          try {
            dispatchEvent(JSON.parse(tail) as unknown)
          } catch {
            // ignore trailing partial JSON
          }
        }

        if (streamResult !== undefined) setResult(streamResult)
      } catch (err) {
        setRunError(err instanceof Error ? err.message : String(err))
      } finally {
        setRunning(false)
      }
    },
    [canRun, workflowId]
  )

  return { stepStatuses, run, running, result, runError, reset }
}
