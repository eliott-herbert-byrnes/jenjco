'use client'

import { code } from '@streamdown/code'
import { useMemo, useState } from 'react'
import { Streamdown } from 'streamdown'
import type { AppRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WorkflowRunInput } from '../hooks/use-workflow-run'
import type { JsonSchemaProps, WorkflowCanvasWorkflow } from '../types'
import { defaultInputFromSchema, orderedInputKeys } from '../utils/schema'

export type WorkflowStepPanelProps = {
  role: AppRole
  workflow: WorkflowCanvasWorkflow
  inputSchema: Record<string, unknown> | undefined
  run: (input: WorkflowRunInput) => Promise<void>
  running: boolean
  result: unknown | null
  runError: string | null
}

export function WorkflowStepPanel({
  role,
  workflow,
  inputSchema,
  run,
  running,
  result,
  runError,
}: WorkflowStepPanelProps) {
  const [inputData, setInputData] = useState<Record<string, string>>(() =>
    defaultInputFromSchema(inputSchema)
  )
  const [prevInputSchema, setPrevInputSchema] = useState(inputSchema)

  if (inputSchema !== prevInputSchema) {
    setPrevInputSchema(inputSchema)
    setInputData(defaultInputFromSchema(inputSchema))
  }

  const canRun = role === 'admin' && workflow.status === 'active'

  const inputKeys = useMemo(
    () => orderedInputKeys(inputSchema as JsonSchemaProps | undefined),
    [inputSchema]
  )
  const inputProps = (inputSchema as JsonSchemaProps | undefined)?.properties ?? {}

  const summaryMarkdown =
    result && typeof result === 'object' && result !== null && 'summary' in result
      ? String((result as { summary: unknown }).summary)
      : result !== null
        ? `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
        : ''

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3">
        <h2 className="text-base font-semibold">Run workflow</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">{workflow.display_name}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {!canRun && (
          <p className="text-muted-foreground text-xs">
            {role !== 'admin'
              ? 'Only organisation admins can run workflows.'
              : 'This workflow is inactive and cannot be run.'}
          </p>
        )}

        <div className="space-y-4">
          {inputKeys.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              This workflow has no configurable inputs.
            </p>
          ) : (
            inputKeys.map((key) => {
              const meta = inputProps[key]
              const description = meta?.description
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
                    value={inputData[key] ?? ''}
                    onChange={(e) =>
                      setInputData((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                </div>
              )
            })
          )}
        </div>

        {runError ? <p className="text-destructive text-xs">{runError}</p> : null}

        {summaryMarkdown ? (
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Result</p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown mode="static" plugins={{ code }}>
                {summaryMarkdown}
              </Streamdown>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t px-4 py-3">
        <Button
          type="button"
          variant="brand-emerald"
          className="w-full"
          disabled={!canRun || running}
          onClick={() => void run({ inputKeys, inputData })}
        >
          {running ? 'Running…' : 'Run'}
        </Button>
      </div>
    </div>
  )
}
