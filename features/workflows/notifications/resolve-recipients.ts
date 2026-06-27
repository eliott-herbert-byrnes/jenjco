import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

import {
  isTeamScopedAudience,
  type NotificationAudience,
  type NotificationTeamScope,
} from "./types"

export type ResolvedRecipient = {
  email: string
  userId: string
}

type ResolveRecipientsParams = {
  orgId: string
  audience: NotificationAudience
  teamScope: NotificationTeamScope
  settingsDepartmentId: string | null
  workflowDepartmentId: string | null
}

function resolveDepartmentId(
  params: ResolveRecipientsParams
): string | null | undefined {
  if (!isTeamScopedAudience(params.audience)) {
    return undefined
  }

  if (params.teamScope === "all") {
    return undefined
  }

  if (params.teamScope === "current") {
    return params.workflowDepartmentId
  }

  return params.settingsDepartmentId
}

function matchesAudienceRole(
  role: string,
  audience: NotificationAudience
): boolean {
  if (audience.startsWith("admins_")) {
    return role === "admin"
  }

  if (audience.startsWith("viewers_")) {
    return role === "viewer"
  }

  return true
}

export async function resolveNotificationRecipients(
  supabase: SupabaseClient<Database>,
  params: ResolveRecipientsParams
): Promise<ResolvedRecipient[]> {
  const departmentId = resolveDepartmentId(params)

  if (departmentId === null) {
    return []
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, role, department_id")
    .eq("org_id", params.orgId)
    .eq("is_active", true)

  if (error || !users) {
    return []
  }

  const seen = new Set<string>()
  const recipients: ResolvedRecipient[] = []

  for (const user of users) {
    if (!matchesAudienceRole(user.role, params.audience)) {
      continue
    }

    if (
      departmentId !== undefined &&
      user.department_id !== departmentId
    ) {
      continue
    }

    const email = user.email.trim().toLowerCase()
    if (!email || seen.has(email)) {
      continue
    }

    seen.add(email)
    recipients.push({ email: user.email, userId: user.id })
  }

  return recipients
}
