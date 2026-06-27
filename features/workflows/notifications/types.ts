import type { Tables } from "@/lib/database.types"

export const NOTIFICATION_TEAM_SCOPES = ["all", "current", "department"] as const
export type NotificationTeamScope = (typeof NOTIFICATION_TEAM_SCOPES)[number]

export const NOTIFICATION_AUDIENCES = [
  "admins_team",
  "admins_org",
  "viewers_team",
  "viewers_org",
  "all_team",
  "all_org",
] as const
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number]

export const NOTIFICATION_EVENT_TYPES = [
  "completion",
  "error",
  "digest",
  "test",
] as const
export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number]

export type WorkflowNotificationSettingsRow =
  Tables<"workflow_notification_settings">

export type WorkflowNotificationSettingsInput = {
  orgWorkflowId: string
  notifyOnCompletion: boolean
  notifyOnError: boolean
  teamScope: NotificationTeamScope
  departmentId: string | null
  audience: NotificationAudience
}

export const TEAM_SCOPE_LABELS: Record<NotificationTeamScope, string> = {
  all: "All teams",
  current: "This workflow's team",
  department: "Specific team",
}

export const AUDIENCE_LABELS: Record<NotificationAudience, string> = {
  admins_team: "Admins (team scoped)",
  admins_org: "Admins (org-wide)",
  viewers_team: "Viewers (team scoped)",
  viewers_org: "Viewers (org-wide)",
  all_team: "All users (team scoped)",
  all_org: "All users (org-wide)",
}

export function isTeamScopedAudience(audience: NotificationAudience): boolean {
  return audience.endsWith("_team")
}

export function formatNotificationEvents(settings: {
  notify_on_completion: boolean
  notify_on_error: boolean
}): string {
  const parts: string[] = []
  if (settings.notify_on_error) parts.push("errors")
  if (settings.notify_on_completion) parts.push("completions")
  return parts.join(" + ")
}

export function formatNotificationAudience(
  settings: Pick<WorkflowNotificationSettingsRow, "audience">,
  departmentName?: string | null
): string {
  const audience = settings.audience as NotificationAudience
  const teamScoped = isTeamScopedAudience(audience)
  const scope = teamScoped ? "team" : "org"

  if (audience.startsWith("admins_")) {
    return departmentName && teamScoped
      ? `${departmentName} admins (${scope})`
      : `admins (${scope})`
  }

  if (audience.startsWith("viewers_")) {
    return departmentName && teamScoped
      ? `${departmentName} viewers (${scope})`
      : `viewers (${scope})`
  }

  return departmentName && teamScoped
    ? `${departmentName} all users (${scope})`
    : `all users (${scope})`
}

export function formatNotificationSummary(
  settings: WorkflowNotificationSettingsRow | null,
  options?: {
    workflowDepartmentName?: string | null
    departmentName?: string | null
  }
): string {
  if (!settings || !settings.enabled) {
    return "No notifications enabled."
  }

  const events = formatNotificationEvents(settings)
  const departmentName =
    settings.team_scope === "department"
      ? options?.departmentName ?? null
      : settings.team_scope === "current"
        ? options?.workflowDepartmentName ?? null
        : null

  const audience = formatNotificationAudience(settings, departmentName)
  return `Enabled — ${events} → ${audience}`
}
