"use server"

import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { DEMO_ADMIN_EMAIL } from "@/features/auth/constants"
import { createClient } from "@/lib/supabase/server"

function safeInternalPath(next: FormDataEntryValue | null): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//")
  ) {
    return paths.dashboard
  }
  return next
}

export async function signInWithDemo(formData: FormData) {
  const password = process.env.SEED_DEMO_PASSWORD?.trim()
  const destination = safeInternalPath(formData.get("next"))

  if (!password) {
    redirect(
      `${paths.signIn}?error=` +
        encodeURIComponent(
          "Demo sign-in is not configured (set SEED_DEMO_PASSWORD)."
        )
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_ADMIN_EMAIL,
    password,
  })

  if (error) {
    const q = new URLSearchParams({ error: error.message })
    if (destination !== paths.dashboard) q.set("next", destination)
    redirect(`${paths.signIn}?${q.toString()}`)
  }

  redirect(destination)
}
