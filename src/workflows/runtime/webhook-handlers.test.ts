import { describe, expect, it } from "vitest"

import {
  classifyNangoWebhook,
  resolveOrgIdFromPayload,
  type NangoWebhookPayload,
} from "./webhook-classification"

const ORG_ID = "98ad35ae-d557-4d08-89c8-617c80cfeb54"

function authPayload(
  overrides: Partial<NangoWebhookPayload> = {}
): NangoWebhookPayload {
  return {
    type: "auth",
    operation: "creation",
    connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
    providerConfigKey: "google-drive",
    success: true,
    tags: { organization_id: ORG_ID },
    ...overrides,
  }
}

describe("resolveOrgIdFromPayload", () => {
  it("reads organization_id from tags", () => {
    expect(resolveOrgIdFromPayload(authPayload())).toBe(ORG_ID)
  })

  it("falls back to endUser.organizationId", () => {
    expect(
      resolveOrgIdFromPayload({
        type: "auth",
        endUser: { organizationId: ORG_ID },
      })
    ).toBe(ORG_ID)
  })

  it("returns null when org id is missing", () => {
    expect(resolveOrgIdFromPayload({ type: "auth" })).toBeNull()
  })
})

describe("classifyNangoWebhook", () => {
  it("routes auth.creation success to upsert_connection", () => {
    expect(classifyNangoWebhook(authPayload())).toEqual({
      action: "upsert_connection",
      orgId: ORG_ID,
      provider: "google-drive",
      connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
      status: "active",
    })
  })

  it("routes auth.override success to upsert_connection", () => {
    expect(
      classifyNangoWebhook(authPayload({ operation: "override" }))
    ).toEqual({
      action: "upsert_connection",
      orgId: ORG_ID,
      provider: "google-drive",
      connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
      status: "active",
    })
  })

  it("does not start a workflow on auth.creation", () => {
    const result = classifyNangoWebhook(authPayload())
    expect(result.action).toBe("upsert_connection")
    expect(result).not.toHaveProperty("workflowKey")
  })

  it("routes auth.refresh failure to reconnect_required", () => {
    expect(
      classifyNangoWebhook(
        authPayload({
          operation: "refresh",
          success: false,
        })
      )
    ).toEqual({
      action: "reconnect_required",
      connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
    })
  })

  it("noops auth.refresh success", () => {
    expect(
      classifyNangoWebhook(
        authPayload({
          operation: "refresh",
          success: true,
        })
      )
    ).toEqual({
      action: "noop",
      reason: "auth_noop:refresh:true",
    })
  })

  it("routes sync.success for google-drive to start_workflow", () => {
    expect(
      classifyNangoWebhook({
        type: "sync",
        connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
        providerConfigKey: "google-drive",
        success: true,
        modifiedAfter: "2026-06-08T12:00:00.000Z",
      })
    ).toEqual({
      action: "start_workflow",
      workflowKey: "google-drive-ingest",
      connectionId: "b7d601e0-f63b-481c-9db6-ca8baa31db4c",
    })
  })

  it("noops sync.success for other providers", () => {
    expect(
      classifyNangoWebhook({
        type: "sync",
        connectionId: "conn-1",
        providerConfigKey: "hubspot",
        success: true,
      })
    ).toEqual({
      action: "noop",
      reason: "sync_noop:hubspot:true",
    })
  })

  it("marks unknown types as unhandled", () => {
    expect(
      classifyNangoWebhook({
        type: "async_action",
        connectionId: "conn-1",
      })
    ).toEqual({
      action: "unhandled",
      reason: "unknown_type:async_action",
    })
  })

  it("marks auth success without org id as unhandled", () => {
    expect(
      classifyNangoWebhook(
        authPayload({
          tags: undefined,
          endUser: undefined,
        })
      )
    ).toEqual({
      action: "unhandled",
      reason: "auth_success_missing_org_id",
    })
  })

  it("marks unknown provider config as unhandled", () => {
    expect(
      classifyNangoWebhook(
        authPayload({
          providerConfigKey: "unknown-integration",
        })
      )
    ).toEqual({
      action: "unhandled",
      reason: "unknown_provider_config:unknown-integration",
    })
  })
})
