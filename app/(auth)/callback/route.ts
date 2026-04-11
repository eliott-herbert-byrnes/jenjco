import { NextResponse } from "next/server"

import { paths } from "@/app/paths"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth / magic-link callback: exchanges `code` for a session and sets auth cookies.
 * Add this URL to Supabase Auth redirect allow list (e.g. http://localhost:3000/callback).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? paths.dashboard

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL(`${paths.signIn}?error=${encodeURIComponent("Could not sign in")}`, origin)
  )
}
