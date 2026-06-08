import { Nango } from "@nangohq/node"

declare global {
  // eslint-disable-next-line no-var
  var __nangoClient: Nango | undefined
}

function createNangoClient(): Nango {
  const secretKey = process.env.NANGO_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error(
      "NANGO_SECRET_KEY is not set. Add your Nango secret key to .env (server-only)."
    )
  }

  const host = process.env.NANGO_SERVER_URL?.trim()
  return new Nango(host ? { secretKey, host } : { secretKey })
}

/** Shared Nango client. Cached on `globalThis` so HMR reloads reuse the same instance. */
export function getNango(): Nango {
  if (!globalThis.__nangoClient) {
    globalThis.__nangoClient = createNangoClient()
  }
  return globalThis.__nangoClient
}
