"use server"

import { z } from "zod"

import { getServerAuth } from "@/lib/auth"
import { isProviderId } from "@/lib/integrations/providers"
import { createAdminClient } from "@/lib/supabase/admin"

const saveCredentialsSchema = z.object({
  provider: z.string(),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
})

export type SaveCredentialsResult =
  | { success: true }
  | { success: false; error: string }

export async function saveCredentials(
  input: z.infer<typeof saveCredentialsSchema>
): Promise<SaveCredentialsResult> {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return { success: false, error: "Unauthorized" }
  }
  if (appUser.role !== "admin") {
    return { success: false, error: "Forbidden" }
  }

  const parsed = saveCredentialsSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid input",
    }
  }

  const { provider, clientId, clientSecret } = parsed.data
  if (!isProviderId(provider)) {
    return { success: false, error: "Invalid provider" }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from("org_provider_credentials").upsert(
    {
      org_id: appUser.orgId,
      provider,
      client_id: clientId,
      client_secret: clientSecret,
      updated_at: now,
    },
    { onConflict: "org_id,provider" }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
