"use client"

import { InfoIcon } from "lucide-react"
import { type ReactNode, useState } from "react"

import { Badge } from "@/components/ui/badge"
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

const REASONS = [
  { value: "outdated", label: "Information is outdated" },
  { value: "process-changed", label: "The process has changed" },
  { value: "incorrect", label: "Contains incorrect details" },
  { value: "compliance", label: "Compliance or policy requirement" },
  { value: "other", label: "Other" },
] as const

type RequestProcessChangeDialogProps = {
  trigger?: ReactNode
}

export function RequestProcessChangeDialog({
  trigger,
}: RequestProcessChangeDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>()
  const [context, setContext] = useState("")

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="brand-emerald">
            Request Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <div className="flex justify-between gap-2">
            <DialogTitle>Request a change</DialogTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="size-7 shrink-0 cursor-help rounded-full px-0"
                >
                  <InfoIcon className="size-4" />
                  <span className="sr-only">How to request a process change</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left">
                Select the reason you would like to request a change to this
                process, and add any context. After review, an admin will be in
                touch.
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-4">
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Reason..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value} className="p-3">
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Additional context..."
            value={context}
            onChange={(event) => setContext(event.target.value)}
            className="min-h-24"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button type="button" disabled>
                  Submit
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Disabled for demo</TooltipContent>
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
