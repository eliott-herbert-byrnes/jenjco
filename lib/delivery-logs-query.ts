import type { SupabaseClient } from "@supabase/supabase-js"

import { paths } from "@/app/paths"
import type { Database } from "@/lib/database.types"

export const DELIVERY_LOGS_PAGE_SIZE = 25

export const DELIVERY_LOGS_SELECT =
  "id, created_at, event_type, recipient_email, delivery_mode, status, error_message, org_workflow_id, org_workflows(display_name)"

export type DeliveryLogsFilterParams = {
  page?: number
  search?: string
  status?: string
  event?: string
}

export type DeliveryLogRow = {
  id: string
  created_at: string
  event_type: string
  recipient_email: string
  delivery_mode: string
  status: string
  error_message: string | null
  org_workflow_id: string
  org_workflows: { display_name: string } | null
}

export function buildDeliveryLogsSearchParams(
  filters: DeliveryLogsFilterParams,
  overrides: Partial<DeliveryLogsFilterParams> = {},
): URLSearchParams {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (merged.page != null && merged.page > 0) {
    params.set("page", String(merged.page))
  }
  if (merged.search) params.set("search", merged.search)
  if (merged.status) params.set("status", merged.status)
  if (merged.event) params.set("event", merged.event)

  return params
}

export function buildDeliveryLogsHref(
  filters: DeliveryLogsFilterParams,
  overrides: Partial<DeliveryLogsFilterParams> = {},
): string {
  const params = buildDeliveryLogsSearchParams(filters, overrides)
  const qs = params.toString()

  return qs
    ? `${paths.analyticsDeliveryLogs}?${qs}`
    : paths.analyticsDeliveryLogs
}

export async function fetchDeliveryLogsPage(
  supabase: SupabaseClient<Database>,
  orgId: string,
  filters: DeliveryLogsFilterParams,
  page: number,
) {
  let workflowIds: string[] | undefined

  const search = filters.search?.trim()
  if (search) {
    const { data: workflows, error: workflowError } = await supabase
      .from("org_workflows")
      .select("id")
      .eq("org_id", orgId)
      .ilike("display_name", `%${search}%`)

    if (workflowError) {
      return { data: null, count: 0, error: workflowError }
    }

    workflowIds = workflows?.map((workflow) => workflow.id) ?? []
    if (workflowIds.length === 0) {
      return { data: [], count: 0, error: null }
    }
  }

  let query = supabase
    .from("workflow_notification_deliveries")
    .select(DELIVERY_LOGS_SELECT, { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (workflowIds) {
    query = query.in("org_workflow_id", workflowIds)
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  if (filters.event) {
    query = query.eq("event_type", filters.event)
  }

  const from = page * DELIVERY_LOGS_PAGE_SIZE
  const to = (page + 1) * DELIVERY_LOGS_PAGE_SIZE - 1

  return query.range(from, to)
}
