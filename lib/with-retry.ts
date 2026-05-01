/**
 * Runs an async function with exponential backoff on failure.
 * Delays: 1s, 2s, … before the last attempt.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i === attempts - 1) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("withRetry: unreachable")
}
