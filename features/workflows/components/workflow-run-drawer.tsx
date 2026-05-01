'use client'

import { code } from '@streamdown/code'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Streamdown } from 'streamdown'
import { apiPaths } from '@/app/paths'
import type { AppRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { StepRunStatus } from '../lib/layout'

type JsonSchemaProps = {
  type?: string
  properties?: Record<string, { type?: string; description?: string }>
  required?: string[]
}

function defaultInputFromSchema(
  inputSchema: Record<string, unknown> | undefined,
  orgId: string
): Record<string, string> {
  const schema = inputSchema as JsonSchemaProps | undefined
  const props = schema?.properties ?? {}
  const out: Record<string, string> = {}
  if ('orgId' in props) out.orgId = orgId
  for (const key of Object.keys(props)) {
    if (out[key] === undefined) out[key] = ''
  }
  return out
}

/** Property keys: required fields first (schema order), then remaining keys in definition order. */
function orderedInputKeys(schema: JsonSchemaProps | undefined): string[] {
  if (!schema?.properties) return []
  const props = schema.properties
  const required = schema.required ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of required) {
    if (k in props && !seen.has(k)) {
      out.push(k)
      seen.add(k)
    }
  }
  for (const k of Object.keys(props)) {
    if (!seen.has(k)) {
      out.push(k)
      seen.add(k)
    }
  }
  return out
}

function applyWorkflowStreamChunk(
  raw: unknown,
  setStepStatuses: React.Dispatch<React.SetStateAction<Record<string, StepRunStatus>>>
): 'workflow-result' | 'error' | 'continue' {
  if (!raw || typeof raw !== 'object') return 'continue'
  const e = raw as Record<string, unknown>
  const type = e.type

  if (type === 'workflow-step-start') {
    const payload = e.payload as { id?: string } | undefined
    const id = payload?.id
    if (id) setStepStatuses((p) => ({ ...p, [id]: 'running' }))
    return 'continue'
  }

  if (type === 'workflow-step-result') {
    const payload = e.payload as { id?: string; status?: string } | undefined
    const id = payload?.id
    const st = payload?.status
    if (id && st === 'success') setStepStatuses((p) => ({ ...p, [id]: 'success' }))
    if (id && st === 'failed') setStepStatuses((p) => ({ ...p, [id]: 'error' }))
    return 'continue'
  }

  // Plan / legacy names (if emitted by other versions)
  if (type === 'step-start') {
    const id = (e.stepId ?? e.id) as string | undefined
    if (id) setStepStatuses((p) => ({ ...p, [id]: 'running' }))
    return 'continue'
  }
  if (type === 'step-complete') {
    const id = (e.stepId ?? e.id) as string | undefined
    if (id) setStepStatuses((p) => ({ ...p, [id]: 'success' }))
    return 'continue'
  }
  if (type === 'step-failed') {
    const id = (e.stepId ?? e.id) as string | undefined
    if (id) setStepStatuses((p) => ({ ...p, [id]: 'error' }))
    return 'continue'
  }

  if (type === 'workflow-result') return 'workflow-result'
  if (type === 'error') return 'error'

  return 'continue'
}

export type WorkflowRunDrawerProps = {
  workflowId: string
  displayName: string
  isActive: boolean
  role: AppRole
  orgId: string
  inputSchema: Record<string, unknown> | undefined
  setStepStatuses: React.Dispatch<React.SetStateAction<Record<string, StepRunStatus>>>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkflowRunDrawer({
  workflowId,
  displayName,
  isActive,
  role,
  orgId,
  inputSchema,
  setStepStatuses,
  open,
  onOpenChange,
}: WorkflowRunDrawerProps) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [inputData, setInputData] = useState<Record<string, string>>(() =>
    defaultInputFromSchema(inputSchema, orgId)
  )

  useEffect(() => {
    if (open) {
      setInputData(defaultInputFromSchema(inputSchema, orgId))
      setResult(null)
      setRunError(null)
    }
  }, [open, inputSchema, orgId])

  const canRun = role === 'admin' && isActive

  const inputKeys = useMemo(
    () => orderedInputKeys(inputSchema as JsonSchemaProps | undefined),
    [inputSchema]
  )
  const inputProps = (inputSchema as JsonSchemaProps | undefined)?.properties ?? {}

  const handleRun = useCallback(async () => {
    if (!canRun) return
    setRunning(true)
    setStepStatuses({})
    setResult(null)
    setRunError(null)

    const body = { inputData }
    let streamResult: unknown | undefined

    const dispatchEvent = (event: unknown) => {
      const outcome = applyWorkflowStreamChunk(event, setStepStatuses)
      if (outcome === 'workflow-result') {
        streamResult = (event as { result?: unknown }).result
      }
      if (outcome === 'error') {
        setRunError(String((event as { message?: unknown }).message ?? 'Unknown error'))
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
  }, [canRun, workflowId, inputData, setStepStatuses])

  const summaryMarkdown =
    result && typeof result === 'object' && result !== null && 'summary' in result
      ? String((result as { summary: unknown }).summary)
      : result !== null
        ? `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
        : ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Run workflow</SheetTitle>
          <SheetDescription>{displayName}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
          {!canRun && (
            <p className="text-muted-foreground text-xs">
              {role !== 'admin'
                ? 'Only organisation admins can run workflows.'
                : 'This workflow is inactive and cannot be run.'}
            </p>
          )}

          <div className="space-y-4">
            {inputKeys.length === 0 ? (
              <p className="text-muted-foreground text-xs">This workflow has no configurable inputs.</p>
            ) : (
              inputKeys.map((key) => {
                const meta = inputProps[key]
                const description = meta?.description
                const isOrgId = key === 'orgId'
                return (
                  <div key={key} className="space-y-2">
                    <div>
                      <Label htmlFor={`workflow-input-${key}`}>{key}</Label>
                      {description ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                      ) : null}
                    </div>
                    <Input
                      id={`workflow-input-${key}`}
                      readOnly={isOrgId}
                      value={inputData[key] ?? ''}
                      onChange={
                        isOrgId
                          ? undefined
                          : (e) => setInputData((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className={cn('font-mono text-xs', isOrgId && 'bg-muted')}
                    />
                  </div>
                )
              })
            )}
          </div>

          {runError && <p className="text-destructive text-xs">{runError}</p>}

          {summaryMarkdown ? (
            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Result</p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown mode="static" plugins={{ code }}>
                  {summaryMarkdown}
                </Streamdown>
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t">
          <Button disabled={!canRun || running} onClick={() => void handleRun()}>
            {running ? 'Running…' : 'Run'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
