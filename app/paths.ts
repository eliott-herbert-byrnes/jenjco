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
  organisation: "/organisation",
  organisationUsers: "/organisation/users",
  integrations: "/organisation/integrations",
  workflows: "/workflows",
  processes: "/organisation/processes",
  orgStructure: "/organisation/org-structure",
  audit: "/audit",
  /** Legacy path; redirected to `signIn` in `next.config.mjs` */
  login: "/login",
} as const

/** Routes that require an authenticated session (see `lib/supabase/update-session.ts`). */
const PROTECTED_APP_PREFIXES: readonly string[] = [
  paths.dashboard,
  paths.agents,
  paths.organisationUsers,
  paths.integrations,
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
  agents: '/api/agents',
  agentChat: (id: string) => `/api/agents/${id}/chat`,
  processes: '/api/processes',
  processDetail: (id: string) => `/api/processes/${id}`,
  workflows: '/api/workflows',
  workflowDetail: (id: string) => `/api/workflows/${id}`,
  workflowRun: (id: string) => `/api/workflows/${id}/run`,
  auditMetrics: '/api/audit/metrics',
  auditInvocations: '/api/audit/invocations',
  auditIntegrations: '/api/audit/integrations',
  auditLogs: '/api/audit/logs',
  orgStructure: '/api/org-structure',
  integrationConnect: (provider: string) =>
    `/api/integrations/${provider}/connect`,
  integrationComplete: (provider: string) =>
    `/api/integrations/${provider}/complete`,
} as const

/** Static assets referenced from route components */
export const assetPaths = {
  placeholder: "/placeholder.svg",
} as const

export type AppPath = (typeof paths)[keyof typeof paths]

/** @deprecated Use `paths.home` */
export const homePath = (): (typeof paths)["home"] => paths.home
