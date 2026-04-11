import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isProtectedAppRoute, paths } from "@/app/paths"

/**
 * Refreshes the Supabase session from cookies and returns a response that may
 * include updated auth cookies. Use from root `proxy.js` / `proxy.ts`.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  if (isProtectedAppRoute(pathname) && !user) {
    const redirectUrl = new URL(paths.signIn, request.url)
    redirectUrl.searchParams.set("next", pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value)
    })
    return redirectResponse
  }

  return supabaseResponse
}
