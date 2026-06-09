import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { paths } from "@/app/paths"
import { createClient } from "@/lib/supabase/server"

function safeInternalPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return paths.dashboard
  }
  return next
}

/**
 * Auth callback: invite/magic links use `token_hash` + `verifyOtp`; OAuth uses `code` exchange.
 * Add this URL to Supabase Auth redirect allow list (e.g. http://localhost:3000/callback).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = safeInternalPath(searchParams.get("next"))
  const supabase = await createClient()

  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  const code = searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL(
      `${paths.signIn}?error=${encodeURIComponent("Could not sign in")}`,
      origin
    )
  )
}
