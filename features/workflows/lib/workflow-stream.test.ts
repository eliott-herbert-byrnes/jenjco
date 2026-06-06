import { describe, expect, it } from "vitest"

import {
  encodeWorkflowStreamChunk,
  mapWorkflowStreamChunk,
} from "./workflow-stream"

describe("mapWorkflowStreamChunk", () => {
  it("maps step-start to drawer-compatible shape", () => {
    const chunk = mapWorkflowStreamChunk({
      type: "step-start",
      stepId: "validate-input",
    })

    expect(chunk).toEqual({ type: "step-start", stepId: "validate-input" })
    expect(chunk).toHaveProperty("stepId", "validate-input")
  })

  it("maps step-complete to drawer-compatible shape", () => {
    const chunk = mapWorkflowStreamChunk({
      type: "step-complete",
      stepId: "gather-processes",
    })

    expect(chunk).toEqual({ type: "step-complete", stepId: "gather-processes" })
  })

  it("maps step-failed with optional message", () => {
    expect(
      mapWorkflowStreamChunk({
        type: "step-failed",
        stepId: "generate-summary",
        message: "model timeout",
      })
    ).toEqual({
      type: "step-failed",
      stepId: "generate-summary",
      message: "model timeout",
    })
  })

  it("omits message when step-failed message is not a string", () => {
    expect(
      mapWorkflowStreamChunk({
        type: "step-failed",
        stepId: "generate-summary",
        message: 42,
      })
    ).toEqual({
      type: "step-failed",
      stepId: "generate-summary",
    })
  })

  it("returns null for unknown type", () => {
    expect(mapWorkflowStreamChunk({ type: "workflow-result", result: {} })).toBeNull()
    expect(mapWorkflowStreamChunk({ type: "error", message: "boom" })).toBeNull()
    expect(mapWorkflowStreamChunk({ type: "workflow-step-start" })).toBeNull()
  })

  it("returns null when stepId is missing or empty", () => {
    expect(mapWorkflowStreamChunk({ type: "step-start" })).toBeNull()
    expect(mapWorkflowStreamChunk({ type: "step-start", stepId: "" })).toBeNull()
    expect(mapWorkflowStreamChunk({ type: "step-complete", stepId: null })).toBeNull()
    expect(mapWorkflowStreamChunk({ type: "step-failed", stepId: undefined })).toBeNull()
  })

  it("returns null for non-object input", () => {
    expect(mapWorkflowStreamChunk(null)).toBeNull()
    expect(mapWorkflowStreamChunk(undefined)).toBeNull()
    expect(mapWorkflowStreamChunk("step-start")).toBeNull()
    expect(mapWorkflowStreamChunk([])).toBeNull()
  })
})

describe("encodeWorkflowStreamChunk", () => {
  it("encodes status chunks as NDJSON", () => {
    const bytes = encodeWorkflowStreamChunk({
      type: "step-start",
      stepId: "validate-input",
    })
    const line = new TextDecoder().decode(bytes)

    expect(line).toBe('{"type":"step-start","stepId":"validate-input"}\n')
    expect(mapWorkflowStreamChunk(JSON.parse(line.trim()))).toEqual({
      type: "step-start",
      stepId: "validate-input",
    })
  })

  it("encodes workflow-result and error terminal chunks", () => {
    const resultLine = new TextDecoder().decode(
      encodeWorkflowStreamChunk({ type: "workflow-result", result: { summary: "ok" } })
    )
    const errorLine = new TextDecoder().decode(
      encodeWorkflowStreamChunk({ type: "error", message: "failed" })
    )

    expect(JSON.parse(resultLine.trim())).toEqual({
      type: "workflow-result",
      result: { summary: "ok" },
    })
    expect(JSON.parse(errorLine.trim())).toEqual({
      type: "error",
      message: "failed",
    })
  })
})
