export type ConnectionStatus = "reconnect_required" | "revoked" | "missing"

type AxiosLikeError = Error & {
  isAxiosError: true
  response?: {
    status?: number
    data?: unknown
  }
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return (
    err instanceof Error &&
    "isAxiosError" in err &&
    (err as AxiosLikeError).isAxiosError === true
  )
}

export class ConnectionError extends Error {
  readonly provider: string
  readonly connectionStatus: ConnectionStatus

  constructor(provider: string, connectionStatus: ConnectionStatus = "missing") {
    const label =
      connectionStatus === "missing"
        ? "not connected"
        : connectionStatus.replace("_", " ")
    super(`Integration ${provider} is ${label}`)
    this.name = "ConnectionError"
    this.provider = provider
    this.connectionStatus = connectionStatus
  }
}

const AUTH_DEAD_MESSAGE_PATTERNS = [
  "invalid_grant",
  "invalid_token",
  "token_expired",
  "refresh_token",
  "unauthorized",
  "authentication failed",
  "credentials have been revoked",
] as const

const AUTH_DEAD_ERROR_CODES = new Set([
  "invalid_grant",
  "invalid_token",
  "token_expired",
  "unauthorized",
  "refresh_token_not_found",
  "authentication_failed",
  "invalid_credentials",
  "connection_refresh_failed",
  "oauth_token_refresh_failed",
])

function collectErrorStrings(value: unknown, out: string[]): void {
  if (value == null) return

  if (typeof value === "string") {
    out.push(value)
    return
  }

  if (typeof value !== "object") return

  const record = value as Record<string, unknown>
  for (const key of ["message", "error", "code", "error_code", "description"]) {
    const field = record[key]
    if (typeof field === "string") {
      out.push(field)
    }
  }

  if (record.response && typeof record.response === "object") {
    collectErrorStrings(record.response, out)
  }
  if (record.data && typeof record.data === "object") {
    collectErrorStrings(record.data, out)
  }
}

function matchesAuthDeadPattern(text: string): boolean {
  const normalized = text.toLowerCase()
  return AUTH_DEAD_MESSAGE_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  )
}

function matchesAuthDeadCode(text: string): boolean {
  return AUTH_DEAD_ERROR_CODES.has(text.toLowerCase())
}

/** True only for auth/token failures that require reconnect — not transient proxy errors. */
export function isAuthDeadError(err: unknown): boolean {
  if (isAxiosLikeError(err)) {
    if (err.response?.status === 401) return true

    const strings: string[] = []
    collectErrorStrings(err.response?.data, strings)
    strings.push(err.message)

    return strings.some(
      (text) => matchesAuthDeadPattern(text) || matchesAuthDeadCode(text)
    )
  }

  if (err instanceof Error) {
    const text = err.message.toLowerCase()
    return (
      matchesAuthDeadPattern(text) ||
      [...AUTH_DEAD_ERROR_CODES].some((code) => text.includes(code))
    )
  }

  const strings: string[] = []
  collectErrorStrings(err, strings)
  return strings.some(
    (text) => matchesAuthDeadPattern(text) || matchesAuthDeadCode(text)
  )
}

export function extractErrorCode(err: unknown): string | null {
  if (isAxiosLikeError(err)) {
    const data = err.response?.data
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>
      for (const key of ["code", "error_code", "error"]) {
        const value = record[key]
        if (typeof value === "string" && value.length > 0) {
          return value
        }
      }
    }
    if (err.response?.status) {
      return `http_${err.response.status}`
    }
  }

  if (err instanceof Error && err.message) {
    return err.message.slice(0, 200)
  }

  return null
}
