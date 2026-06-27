"use client"

import { InfoIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { disableWorkflowNotification } from "@/features/workflows/notifications/actions/disable-workflow-notification"
import { sendTestNotification } from "@/features/workflows/notifications/actions/send-test-notification"
import { upsertWorkflowNotification } from "@/features/workflows/notifications/actions/upsert-workflow-notification"
import {
  AUDIENCE_LABELS,
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_TEAM_SCOPES,
  TEAM_SCOPE_LABELS,
  type NotificationAudience,
  type NotificationTeamScope,
  type WorkflowNotificationSettingsRow,
} from "@/features/workflows/notifications/types"
import type { WorkflowHubRow } from "@/features/workflows/types"
import { useServerAction } from "@/lib/hooks/use-server-action"
import { createClient } from "@/lib/supabase/client"

type DepartmentOption = { id: string; name: string }

type WorkflowNotificationsDialogProps = {
  workflow: WorkflowHubRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: DepartmentOption[]
  onSettingsChanged?: () => void
}

function buildFormState(settings: WorkflowNotificationSettingsRow | null) {
  if (settings?.enabled) {
    return {
      notifyOnCompletion: settings.notify_on_completion,
      notifyOnError: settings.notify_on_error,
      teamScope: settings.team_scope as NotificationTeamScope,
      departmentId: settings.department_id,
      audience: settings.audience as NotificationAudience,
    }
  }

  return {
    notifyOnCompletion: true,
    notifyOnError: true,
    teamScope: "current" as NotificationTeamScope,
    departmentId: null as string | null,
    audience: "admins_team" as NotificationAudience,
  }
}

function WorkflowNotificationsForm({
  workflow,
  departments,
  existingSettings,
  onOpenChange,
  onSettingsChanged,
}: {
  workflow: WorkflowHubRow
  departments: DepartmentOption[]
  existingSettings: WorkflowNotificationSettingsRow | null
  onOpenChange: (open: boolean) => void
  onSettingsChanged?: () => void
}) {
  const router = useRouter()
  const initial = useMemo(
    () => buildFormState(existingSettings),
    [existingSettings]
  )
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(
    initial.notifyOnCompletion
  )
  const [notifyOnError, setNotifyOnError] = useState(initial.notifyOnError)
  const [teamScope, setTeamScope] = useState<NotificationTeamScope>(
    initial.teamScope
  )
  const [departmentId, setDepartmentId] = useState<string | null>(
    initial.departmentId
  )
  const [audience, setAudience] = useState<NotificationAudience>(
    initial.audience
  )

  const payload = {
    orgWorkflowId: workflow.id,
    notifyOnCompletion,
    notifyOnError,
    teamScope,
    departmentId: teamScope === "department" ? departmentId : null,
    audience,
  }

  const refresh = () => {
    onSettingsChanged?.()
    router.refresh()
  }

  const { execute: save, pending: saving } = useServerAction(
    upsertWorkflowNotification,
    {
      successMessage: "Notification settings saved",
      onSuccess: () => {
        refresh()
        onOpenChange(false)
      },
    }
  )

  const { execute: disable, pending: disabling } = useServerAction(
    disableWorkflowNotification,
    {
      successMessage: "Notifications removed",
      onSuccess: () => {
        refresh()
        onOpenChange(false)
      },
    }
  )

  const { execute: sendTest, pending: sendingTest } = useServerAction(
    sendTestNotification,
    {
      successMessage: "Test notification sent",
      onSuccess: refresh,
    }
  )

  const busy = saving || disabling || sendingTest
  const hasEnabledSettings = existingSettings?.enabled === true

  return (
    <>
      <FieldGroup className="gap-4">

        <Field>
          <FieldLabel>Team scope</FieldLabel>
          <Select
            value={teamScope}
            onValueChange={(value) => {
              const nextScope = value as NotificationTeamScope
              setTeamScope(nextScope)
              if (nextScope !== "department") {
                setDepartmentId(null)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select team scope..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {NOTIFICATION_TEAM_SCOPES.map((scope) => (
                <SelectItem key={scope} value={scope}>
                  {TEAM_SCOPE_LABELS[scope]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {teamScope === "department" ? (
          <Field>
            <FieldLabel>Specific team</FieldLabel>
            <Select
              value={departmentId ?? undefined}
              onValueChange={(value) => setDepartmentId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <Field>
          <FieldLabel>Audience</FieldLabel>
          <Select
            value={audience}
            onValueChange={(value) => setAudience(value as NotificationAudience)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select audience..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {NOTIFICATION_AUDIENCES.map((option) => (
                <SelectItem key={option} value={option}>
                  {AUDIENCE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>



          <FieldLabel>Notification type</FieldLabel>
          <Field orientation="horizontal">
            <Checkbox
              id={`notify-completion-${workflow.id}`}
              checked={notifyOnCompletion}
              onCheckedChange={(checked) =>
                setNotifyOnCompletion(checked === true)
              }
            />
            <FieldLabel htmlFor={`notify-completion-${workflow.id}`}>
              On completion
            </FieldLabel>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id={`notify-error-${workflow.id}`}
              checked={notifyOnError}
              onCheckedChange={(checked) => setNotifyOnError(checked === true)}
            />
            <FieldLabel htmlFor={`notify-error-${workflow.id}`}>
              On error
            </FieldLabel>
          </Field>


      </FieldGroup>
      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => void save(payload)}
          >
            Save
          </Button>
          {hasEnabledSettings ? (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void disable({ orgWorkflowId: workflow.id })
              }
            >
              Remove notifications
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void sendTest(payload)}
          >
            Send test
          </Button>
        </div>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={busy}>
            Cancel
          </Button>
        </DialogClose>
      </div>
    </>
  )
}

export function WorkflowNotificationsDialog({
  workflow,
  open,
  onOpenChange,
  departments,
  onSettingsChanged,
}: WorkflowNotificationsDialogProps) {
  const [existingSettings, setExistingSettings] =
    useState<WorkflowNotificationSettingsRow | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !workflow) {
      return
    }

    const orgWorkflowId = workflow.id
    let cancelled = false

    async function loadSettings() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("workflow_notification_settings")
        .select("*")
        .eq("org_workflow_id", orgWorkflowId)
        .maybeSingle()

      if (cancelled) return

      setExistingSettings(error ? null : data)
      setLoading(false)
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [open, workflow])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4">
        <DialogHeader>
          <div className="flex justify-between gap-2">
            <DialogTitle>
              Notifications — {workflow?.display_name ?? "Workflow"}
            </DialogTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="size-7 shrink-0 cursor-help rounded-full px-0"
                >
                  <InfoIcon className="size-4" />
                  <span className="sr-only">How workflow notifications work</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left">
                When a workflow completes or fails, Jenjco can email the
                selected audience. Choose which events to monitor, which team
                scope applies, and who should receive alerts. Use Send test to
                verify delivery before saving.
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>
        <Separator />
        {loading || !workflow ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <WorkflowNotificationsForm
            key={`${workflow.id}-${existingSettings?.updated_at ?? "new"}`}
            workflow={workflow}
            departments={departments}
            existingSettings={existingSettings}
            onOpenChange={onOpenChange}
            onSettingsChanged={onSettingsChanged}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
