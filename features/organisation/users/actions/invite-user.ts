"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { paths } from "@/app/paths"
import { createAdminClient } from "@/lib/supabase/admin"

import {
  buildInviteCallbackLink,
  findAuthUserByEmail,
  getAppOrigin,
  normalizeEmail,
  requireAdminActor,
  toActorGuardUser,
  type ActionResult,
} from "../lib/action-helpers"
import { assertCanInvite } from "../lib/user-guards"

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "viewer"]),
  displayName: z.string().max(100).optional(),
})

export type InviteUserResult = ActionResult

export async function inviteUser(
  input: z.infer<typeof inviteUserSchema>
): Promise<InviteUserResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = inviteUserSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid input",
    }
  }

  const email = normalizeEmail(parsed.data.email)
  const { role, displayName } = parsed.data

  const inviteGuard = assertCanInvite(toActorGuardUser(appUser), { email, role })
  if (!inviteGuard.ok) {
    return { success: false, error: inviteGuard.message }
  }

  const admin = createAdminClient()

  const { data: existingMember } = await admin
    .from("users")
    .select("id")
    .eq("org_id", appUser.orgId)
    .eq("email", email)
    .maybeSingle()

  if (existingMember) {
    return { success: false, error: "Already a member" }
  }

  const { data: profileByEmail } = await admin
    .from("users")
    .select("org_id")
    .eq("email", email)
    .maybeSingle()

  if (profileByEmail && profileByEmail.org_id !== appUser.orgId) {
    return {
      success: false,
      error: "User belongs to another organization",
    }
  }

  const origin = await getAppOrigin()
  const redirectTo = `${origin}${paths.authCallback}`

  let supabaseAuthId: string
  let inviteLink: string
  let createdNewAuthUser = false

  const existingAuthUser = await findAuthUserByEmail(admin, email)

  if (existingAuthUser) {
    const { data: profileByAuthId } = await admin
      .from("users")
      .select("org_id")
      .eq("supabase_auth_id", existingAuthUser.id)
      .maybeSingle()

    if (profileByAuthId && profileByAuthId.org_id !== appUser.orgId) {
      return {
        success: false,
        error: "User belongs to another organization",
      }
    }

    supabaseAuthId = existingAuthUser.id

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    })

    if (linkError) {
      return { success: false, error: linkError.message }
    }

    const hashedToken = linkData.properties.hashed_token
    if (!hashedToken) {
      return { success: false, error: "Failed to create invite link" }
    }

    inviteLink = buildInviteCallbackLink(origin, hashedToken)
  } else {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    })

    if (linkError) {
      return { success: false, error: linkError.message }
    }

    if (!linkData.user) {
      return { success: false, error: "Failed to create invite" }
    }

    supabaseAuthId = linkData.user.id
    createdNewAuthUser = true

    const hashedToken = linkData.properties.hashed_token
    if (!hashedToken) {
      await admin.auth.admin.deleteUser(supabaseAuthId)
      return { success: false, error: "Failed to create invite link" }
    }

    inviteLink = buildInviteCallbackLink(origin, hashedToken)
  }

  const { error: insertError } = await admin.from("users").insert({
    org_id: appUser.orgId,
    supabase_auth_id: supabaseAuthId,
    email,
    role,
    display_name: displayName ?? null,
    is_active: true,
    invited_at: new Date().toISOString(),
  })

  if (insertError) {
    if (createdNewAuthUser) {
      await admin.auth.admin.deleteUser(supabaseAuthId)
    }
    return { success: false, error: insertError.message }
  }

  revalidatePath(paths.organisationUsers)
  return { success: true, inviteLink }
}
