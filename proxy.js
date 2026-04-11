import { updateSession } from "./lib/supabase/update-session"

/**
 * Next.js 16+ Proxy (replaces middleware). Refreshes Supabase cookies and
 * protects dashboard routes — unauthenticated users are sent to sign-in
 * (see `paths` in `app/paths.ts`, `lib/supabase/update-session.ts`).
 */
export function proxy(request) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
