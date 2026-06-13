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

type RequestWorkflowDialogProps = {
  teams: { id: string; name: string }[]
  trigger?: ReactNode
}

export function RequestWorkflowDialog({
  teams,
  trigger,
}: RequestWorkflowDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>()
  const [description, setDescription] = useState("")

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            Request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <div className="flex justify-between gap-2">
            <DialogTitle>Request a new workflow</DialogTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="size-7 shrink-0 cursor-help rounded-full px-0"
                >
                  <InfoIcon className="size-4" />
                  <span className="sr-only">How to request a new workflow</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left">
                Please select the team you would like to request a new workflow
                for, followed by a description of the workflow. Please include
                which tools the workflow will interact with. After review, a
                member of the Jenjco team will be in touch with your team.
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-4">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Team..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id} className="p-3">
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Short description of workflow requirements..."
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
                  Request
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
