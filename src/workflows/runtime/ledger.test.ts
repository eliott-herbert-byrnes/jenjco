import { beforeEach, describe, expect, it, vi } from "vitest"

const workflowRunsInsert = vi.fn()
const workflowRunsUpdate = vi.fn()
const workflowRunsUpdateEq = vi.fn()
const workflowStepRunsUpsert = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "workflow_runs") {
        return {
          insert: workflowRunsInsert,
          update: workflowRunsUpdate,
        }
      }
      if (table === "workflow_step_runs") {
        return {
          upsert: workflowStepRunsUpsert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

import {
  completeRun,
  createRun,
  failRun,
  markStep,
} from "./ledger"

function mockInsertSuccess(id: string) {
  workflowRunsInsert.mockReturnValue({
    select: () => ({
      single: async () => ({ data: { id }, error: null }),
    }),
  })
}

function mockUpdateSuccess() {
  workflowRunsUpdateEq.mockResolvedValue({ error: null })
  workflowRunsUpdate.mockReturnValue({
    eq: workflowRunsUpdateEq,
  })
}

function mockUpsertSuccess() {
  workflowStepRunsUpsert.mockResolvedValue({ error: null })
}

describe("ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsertSuccess("ledger-run-1")
    mockUpdateSuccess()
    mockUpsertSuccess()
  })

  describe("createRun", () => {
    it("inserts a workflow run and returns ledgerRunId", async () => {
      const ledgerRunId = await createRun({
        id: "pre-generated-id",
        orgId: "org-1",
        workflowKey: "process-knowledge-summary",
        vercelRunId: "vercel-run-1",
        startedBy: "user-1",
        input: { foo: "bar" },
      })

      expect(ledgerRunId).toBe("ledger-run-1")
      expect(workflowRunsInsert).toHaveBeenCalledWith({
        id: "pre-generated-id",
        org_id: "org-1",
        workflow_key: "process-knowledge-summary",
        vercel_run_id: "vercel-run-1",
        started_by: "user-1",
        trigger: "manual",
        input: { foo: "bar" },
        status: "running",
      })
    })

    it("defaults trigger and null input when omitted", async () => {
      await createRun({
        orgId: "org-1",
        workflowKey: "process-knowledge-summary",
        vercelRunId: "vercel-run-2",
      })

      expect(workflowRunsInsert).toHaveBeenCalledWith({
        org_id: "org-1",
        workflow_key: "process-knowledge-summary",
        vercel_run_id: "vercel-run-2",
        started_by: null,
        trigger: "manual",
        input: null,
        status: "running",
      })
    })
  })

  describe("markStep", () => {
    it("upserts a step run on (run_id, step_id)", async () => {
      await markStep({
        ledgerRunId: "ledger-run-1",
        stepId: "validate-input",
        kind: "deterministic",
        status: "running",
      })

      expect(workflowStepRunsUpsert).toHaveBeenCalledWith(
        {
          run_id: "ledger-run-1",
          step_id: "validate-input",
          kind: "deterministic",
          status: "running",
          tokens_in: 0,
          tokens_out: 0,
        },
        { onConflict: "run_id,step_id" }
      )
    })

    it("passes token totals when provided", async () => {
      await markStep({
        ledgerRunId: "ledger-run-1",
        stepId: "generate-summary",
        kind: "ai",
        status: "completed",
        tokensIn: 120,
        tokensOut: 45,
      })

      expect(workflowStepRunsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tokens_in: 120,
          tokens_out: 45,
          status: "completed",
        }),
        { onConflict: "run_id,step_id" }
      )
    })

    it("includes error in upsert payload when provided", async () => {
      await markStep({
        ledgerRunId: "ledger-run-1",
        stepId: "gather-processes",
        kind: "deterministic",
        status: "failed",
        error: { reason: "timeout exceeded", description: "Step timed out after 30s" },
      })

      expect(workflowStepRunsUpsert).toHaveBeenCalledWith(
        {
          run_id: "ledger-run-1",
          step_id: "gather-processes",
          kind: "deterministic",
          status: "failed",
          tokens_in: 0,
          tokens_out: 0,
          error: { reason: "timeout exceeded", description: "Step timed out after 30s" },
        },
        { onConflict: "run_id,step_id" }
      )
    })

    it("omits error from upsert payload when not provided", async () => {
      await markStep({
        ledgerRunId: "ledger-run-1",
        stepId: "validate-input",
        kind: "deterministic",
        status: "running",
      })

      expect(workflowStepRunsUpsert).toHaveBeenCalledWith(
        expect.not.objectContaining({ error: expect.anything() }),
        { onConflict: "run_id,step_id" }
      )
    })
  })

  describe("completeRun", () => {
    it("marks the run completed with output and token roll-up", async () => {
      await completeRun({
        ledgerRunId: "ledger-run-1",
        output: { summary: "done" },
        tokensIn: 200,
        tokensOut: 80,
      })

      expect(workflowRunsUpdate).toHaveBeenCalledWith({
        status: "completed",
        output: { summary: "done" },
        tokens_in: 200,
        tokens_out: 80,
        completed_at: expect.any(String),
      })
      expect(workflowRunsUpdateEq).toHaveBeenCalledWith("id", "ledger-run-1")
    })
  })

  describe("failRun", () => {
    it("marks the run failed with an error message", async () => {
      await failRun({
        ledgerRunId: "ledger-run-1",
        error: "step exploded",
      })

      expect(workflowRunsUpdate).toHaveBeenCalledWith({
        status: "failed",
        error: "step exploded",
        completed_at: expect.any(String),
      })
      expect(workflowRunsUpdateEq).toHaveBeenCalledWith("id", "ledger-run-1")
    })
  })

  describe("transitions", () => {
    it("createRun → markStep → completeRun", async () => {
      const ledgerRunId = await createRun({
        orgId: "org-1",
        workflowKey: "process-knowledge-summary",
        vercelRunId: "vercel-run-3",
      })

      await markStep({
        ledgerRunId,
        stepId: "validate-input",
        kind: "deterministic",
        status: "running",
      })
      await markStep({
        ledgerRunId,
        stepId: "validate-input",
        kind: "deterministic",
        status: "completed",
      })
      await completeRun({
        ledgerRunId,
        output: { summary: "ok" },
        tokensIn: 0,
        tokensOut: 0,
      })

      expect(workflowRunsInsert).toHaveBeenCalledTimes(1)
      expect(workflowStepRunsUpsert).toHaveBeenCalledTimes(2)
      expect(workflowRunsUpdate).toHaveBeenCalledTimes(1)
    })

    it("createRun → markStep(failed) → failRun", async () => {
      const ledgerRunId = await createRun({
        orgId: "org-1",
        workflowKey: "process-knowledge-summary",
        vercelRunId: "vercel-run-4",
      })

      await markStep({
        ledgerRunId,
        stepId: "gather-processes",
        kind: "deterministic",
        status: "failed",
      })
      await failRun({
        ledgerRunId,
        error: "gather failed",
      })

      expect(workflowStepRunsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" }),
        { onConflict: "run_id,step_id" }
      )
      expect(workflowRunsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed", error: "gather failed" })
      )
    })
  })
})
