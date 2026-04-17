/**
 * Canonical application pathnames (leading `/`, no trailing slash).
 * Use these instead of hardcoded `"/…"` strings so routes stay consistent.
 */
export const paths = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  /** OAuth / magic-link callback (Supabase redirect URL) */
  authCallback: "/callback",
  /** App home / main dashboard (same as {@link paths.home}) */
  dashboard: "/",
  agents: "/agents",
  workflows: "/workflows",
  processes: "/processes",
  orgStructure: "/org-structure",
  audit: "/audit",
  /** Sample Mastra chat UI */
  chat: "/chat",
  /** Legacy path; redirected to `signIn` in `next.config.mjs` */
  login: "/login",
} as const

/** Routes that require an authenticated session (see `lib/supabase/update-session.ts`). */
const PROTECTED_APP_PREFIXES: readonly string[] = [
  paths.dashboard,
  paths.agents,
  paths.workflows,
  paths.processes,
  paths.orgStructure,
  paths.audit,
]

export function isProtectedAppRoute(pathname: string): boolean {
  return PROTECTED_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export const apiPaths = {
  chat: '/api/chat',
  agents: '/api/agents',
  agentChat: (id: string) => `/api/agents/${id}/chat`,
} as const

/** Static assets referenced from route components */
export const assetPaths = {
  placeholder: "/placeholder.svg",
} as const

export type AppPath = (typeof paths)[keyof typeof paths]

/** @deprecated Use `paths.home` */
export const homePath = (): (typeof paths)["home"] => paths.home
