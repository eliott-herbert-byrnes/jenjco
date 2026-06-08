import { describe, expect, it } from "vitest"
import {
  ConnectionError,
  extractErrorCode,
  isAuthDeadError,
} from "./errors"

function axiosLikeError(
  status: number,
  data?: unknown,
  message = "Request failed"
): Error {
  const err = new Error(message) as Error & {
    isAxiosError: true
    response: { status: number; data?: unknown }
  }
  err.isAxiosError = true
  err.response = { status, data }
  return err
}

describe("isAuthDeadError", () => {
  it("returns true for HTTP 401", () => {
    expect(isAuthDeadError(axiosLikeError(401))).toBe(true)
  })

  it("returns false for HTTP 500", () => {
    expect(
      isAuthDeadError(axiosLikeError(500, { message: "upstream error" }))
    ).toBe(false)
  })

  it("returns false for HTTP 403", () => {
    expect(isAuthDeadError(axiosLikeError(403))).toBe(false)
  })

  it("returns true for invalid_grant in response body", () => {
    expect(
      isAuthDeadError(
        axiosLikeError(400, {
          error: "invalid_grant",
          error_description: "Token revoked",
        })
      )
    ).toBe(true)
  })

  it("returns true for Nango oauth refresh failure codes", () => {
    expect(
      isAuthDeadError(axiosLikeError(400, { code: "oauth_token_refresh_failed" }))
    ).toBe(true)
  })

  it("returns true for Error messages mentioning refresh_token", () => {
    expect(
      isAuthDeadError(new Error("refresh_token_not_found for connection"))
    ).toBe(true)
  })

  it("returns false for generic network errors", () => {
    expect(isAuthDeadError(new Error("ECONNRESET"))).toBe(false)
  })
})

describe("ConnectionError", () => {
  it("exposes provider and connection status", () => {
    const err = new ConnectionError("google-drive", "reconnect_required")
    expect(err.provider).toBe("google-drive")
    expect(err.connectionStatus).toBe("reconnect_required")
    expect(err.message).toContain("reconnect required")
  })
})

describe("extractErrorCode", () => {
  it("reads code from axios response data", () => {
    expect(
      extractErrorCode(axiosLikeError(400, { code: "rate_limited" }))
    ).toBe("rate_limited")
  })

  it("falls back to http status", () => {
    expect(extractErrorCode(axiosLikeError(502))).toBe("http_502")
  })
})
