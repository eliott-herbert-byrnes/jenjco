import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

export async function fetchOrgWorkflowForNotifications(
  supabase: SupabaseClient<Database>,
  orgId: string,
  orgWorkflowId: string
): Promise<
  | {
      ok: true
      workflow: {
        id: string
        org_id: string
        display_name: string
        department_id: string | null
      }
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from("org_workflows")
    .select("id, org_id, display_name, department_id")
    .eq("id", orgWorkflowId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!data) {
    return { ok: false, error: "Workflow not found" }
  }

  return { ok: true, workflow: data }
}

export async function validateNotificationDepartment(
  supabase: SupabaseClient<Database>,
  orgId: string,
  departmentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!data) {
    return { ok: false, error: "Invalid team" }
  }

  return { ok: true }
}
