import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser Supabase client for Client Components.
 * Requires NEXT_PUBLIC_* env vars (same values as SUPABASE_URL / SUPABASE_ANON_KEY).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and set them."
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
