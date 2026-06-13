"use client"

import { type ReactNode, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const FLAG_ERROR_OPTIONS = [
  "Incorrect or unexpected output",
  "Workflow failed to complete",
  "Missing or skipped step",
  "Timeout / performance issue",
  "Integration error",
  "Other",
] as const

type FlagWorkflowDialogProps = {
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FlagWorkflowDialog({
  trigger,
  open,
  onOpenChange,
}: FlagWorkflowDialogProps) {
  const [errorType, setErrorType] = useState<string>()
  const [description, setDescription] = useState("")
  const isControlled = open !== undefined

  return (
    <Dialog
      {...(isControlled ? { open, onOpenChange } : {})}
    >
      {!isControlled ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline">
              Flag
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <DialogTitle>Flag workflow</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-4">
          <Select value={errorType} onValueChange={setErrorType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Error type..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {FLAG_ERROR_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="p-3">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Describe what went wrong..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button type="button" disabled>
                  Flag
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Disabled for MVP</TooltipContent>
          </Tooltip>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
