import { beforeEach, describe, expect, it, vi } from "vitest"

const workflowRunsMaybeSingle = vi.fn()
const webhookDeliveriesInsert = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "workflow_runs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: workflowRunsMaybeSingle,
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === "webhook_deliveries") {
        return {
          insert: webhookDeliveriesInsert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

import {
  buildCronWindowKey,
  buildWebhookIdempotencyKey,
  claimWebhookDelivery,
  getWebhookTimestampField,
  hasRunningWorkflow,
  type NangoWebhookPayload,
} from "./idempotency"

describe("idempotency pure helpers", () => {
  it("builds auth webhook keys without a timestamp", () => {
    const payload: NangoWebhookPayload = {
      type: "auth",
      operation: "creation",
      connectionId: "conn-1",
      success: true,
    }

    expect(buildWebhookIdempotencyKey(payload)).toBe(
      "webhook:auth:creation:conn-1:"
    )
  })

  it("uses syncName and modifiedAfter for sync success keys", () => {
    const payload: NangoWebhookPayload = {
      type: "sync",
      syncName: "drive-files",
      connectionId: "conn-2",
      success: true,
      modifiedAfter: "2026-06-08T12:00:00.000Z",
    }

    expect(getWebhookTimestampField(payload)).toBe("2026-06-08T12:00:00.000Z")
    expect(buildWebhookIdempotencyKey(payload)).toBe(
      "webhook:sync:drive-files:conn-2:2026-06-08T12:00:00.000Z"
    )
  })

  it("prefers failedAt for sync failure keys", () => {
    const payload: NangoWebhookPayload = {
      type: "sync",
      syncName: "drive-files",
      connectionId: "conn-3",
      success: false,
      startedAt: "2026-06-08T11:00:00.000Z",
      failedAt: "2026-06-08T11:05:00.000Z",
    }

    expect(buildWebhookIdempotencyKey(payload)).toBe(
      "webhook:sync:drive-files:conn-3:2026-06-08T11:05:00.000Z"
    )
  })

  it("builds UTC cron window keys", () => {
    const key = buildCronWindowKey(
      "org-wf-1",
      new Date("2026-06-08T15:30:00.000Z")
    )
    expect(key).toBe("cron:org-wf-1:2026-06-08")
  })
})

describe("idempotency DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("hasRunningWorkflow returns true when a running row exists", async () => {
    workflowRunsMaybeSingle.mockResolvedValue({ data: { id: "run-1" }, error: null })

    await expect(
      hasRunningWorkflow("org-1", "google-drive-ingest")
    ).resolves.toBe(true)
  })

  it("hasRunningWorkflow returns false when no running row exists", async () => {
    workflowRunsMaybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(
      hasRunningWorkflow("org-1", "google-drive-ingest")
    ).resolves.toBe(false)
  })

  it("claimWebhookDelivery returns true on first insert", async () => {
    webhookDeliveriesInsert.mockResolvedValue({ error: null })

    await expect(claimWebhookDelivery("webhook:auth:creation:c1:")).resolves.toBe(
      true
    )
    expect(webhookDeliveriesInsert).toHaveBeenCalledWith({
      idempotency_key: "webhook:auth:creation:c1:",
      source: "nango",
    })
  })

  it("claimWebhookDelivery returns false on duplicate key", async () => {
    webhookDeliveriesInsert.mockResolvedValue({
      error: { code: "23505", message: "duplicate" },
    })

    await expect(claimWebhookDelivery("webhook:auth:creation:c1:")).resolves.toBe(
      false
    )
  })
})
