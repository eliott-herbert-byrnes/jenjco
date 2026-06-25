"use client"

import { InfoIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { RequestWorkflowDialog } from "@/features/workflows/components/request-workflow-dialog"
import { BRAND_BADGE_CLASSES } from "@/lib/brand-colors"

type Team = {
  id: string
  name: string
}

type FeaturedActionsClientProps = {
  teams: Team[]
}

const STUB_CONSULTATIONS = [
  {
    id: "workflow-discovery",
    name: "Workflow discovery session",
  },
  {
    id: "integration-planning",
    name: "Integration planning call",
  },
  {
    id: "automation-roadmap",
    name: "Automation roadmap review",
  },
] as const

export function FeaturedActionsClient({ teams }: FeaturedActionsClientProps) {
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>()
  const [consultationNotes, setConsultationNotes] = useState("")

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
      <Card>
        <CardHeader>
          {/* TODO: derive from real department data */}
          <Badge className={BRAND_BADGE_CLASSES.orange}>Operations</Badge>
          <CardTitle>Get a summary of recently executed workflows</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="size-6 rounded bg-muted" />
            <div className="size-6 rounded bg-muted" />
            <div className="size-6 rounded bg-muted" />
          </div>
          <Button variant="secondary" asChild>
            <a href="#">Execute</a>
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Request a new workflow</CardTitle>
        </CardHeader>
        <CardFooter className="mt-auto">
          <RequestWorkflowDialog teams={teams} />
        </CardFooter>
      </Card>

      <Dialog>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Book a consultation</CardTitle>
          </CardHeader>
          <CardFooter className="mt-auto">
            <DialogTrigger asChild>
              <Button variant="brand-sky">Book</Button>
            </DialogTrigger>
          </CardFooter>
        </Card>
        <DialogContent showCloseButton={false} className="gap-4">
          <DialogHeader>
            <div className="flex justify-between gap-2">
              <DialogTitle>Book a consultation</DialogTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="size-7 shrink-0 cursor-help rounded-full px-0"
                  >
                    <InfoIcon className="size-4" />
                    <span className="sr-only">
                      How to book a consultation
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left">
                  Select the type of consultation you would like to book and
                  share any context that will help us prepare. After review, a
                  member of the Jenjco team will be in touch to confirm your
                  booking.
                </TooltipContent>
              </Tooltip>
            </div>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-4">
            <Select
              value={selectedConsultationId}
              onValueChange={setSelectedConsultationId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Consultation..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {STUB_CONSULTATIONS.map((consultation) => (
                  <SelectItem
                    key={consultation.id}
                    value={consultation.id}
                    className="p-3"
                  >
                    {consultation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional context for your consultation..."
              value={consultationNotes}
              onChange={(event) => setConsultationNotes(event.target.value)}
              className="min-h-24"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button type="button" disabled>
                    Book
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
    </div>
  )
}
