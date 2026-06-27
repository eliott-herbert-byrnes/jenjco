'use client'

import {
  AlertCircleIcon,
  Building2Icon,
  CheckCircle2Icon,
  UsersIcon,
} from 'lucide-react'

import {
  AUDIENCE_LABELS,
  TEAM_SCOPE_LABELS,
  type NotificationAudience,
  type NotificationTeamScope,
  type WorkflowNotificationSettingsRow,
} from '@/features/workflows/notifications/types'

type WorkflowNotificationSummaryProps = {
  settings: WorkflowNotificationSettingsRow | null
  workflowDepartmentName?: string | null
  departmentName?: string | null
}

function resolveTeamScopeLabel(
  settings: WorkflowNotificationSettingsRow,
  options: {
    workflowDepartmentName?: string | null
    departmentName?: string | null
  }
): string {
  const scope = settings.team_scope as NotificationTeamScope

  if (scope === 'department' && options.departmentName) {
    return options.departmentName
  }

  if (scope === 'current' && options.workflowDepartmentName) {
    return `${TEAM_SCOPE_LABELS.current} (${options.workflowDepartmentName})`
  }

  return TEAM_SCOPE_LABELS[scope]
}

function SummaryRow({
  icon: Icon,
  label,
}: {
  icon: typeof CheckCircle2Icon
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm bg-gray-400/10 p-2 text-sm">
      <Icon className="ml-1 mr-1 size-4 shrink-0 text-muted-foreground" />
      {label}
    </div>
  )
}

export function WorkflowNotificationSummary({
  settings,
  workflowDepartmentName,
  departmentName,
}: WorkflowNotificationSummaryProps) {
  if (!settings?.enabled) {
    return (
      <p className="text-xs text-muted-foreground">No notifications enabled</p>
    )
  }

  const audience =
    AUDIENCE_LABELS[settings.audience as NotificationAudience]
  const teamScope = resolveTeamScopeLabel(settings, {
    workflowDepartmentName,
    departmentName,
  })

  return (
    <div className="flex flex-col gap-2">
      {settings.notify_on_completion ? (
        <SummaryRow icon={CheckCircle2Icon} label="When the workflow completes" />
      ) : null}
      {settings.notify_on_error ? (
        <SummaryRow icon={AlertCircleIcon} label="When the workflow errors" />
      ) : null}
      <SummaryRow icon={UsersIcon} label={`Recipients: ${audience}`} />
      <SummaryRow icon={Building2Icon} label={`Team scope: ${teamScope}`} />
    </div>
  )
}
