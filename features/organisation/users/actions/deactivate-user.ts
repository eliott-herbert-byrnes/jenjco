"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { paths } from "@/app/paths"
import { createAdminClient } from "@/lib/supabase/admin"

import {
  buildGuardContext,
  countOrgAdmins,
  fetchTargetUser,
  requireAdminActor,
  toActorGuardUser,
  toGuardUser,
  type ActionResult,
} from "../lib/action-helpers"
import { assertCanDeactivate } from "../lib/user-guards"

const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
})

export type DeactivateUserResult = ActionResult

export async function deactivateUser(
  input: z.infer<typeof deactivateUserSchema>
): Promise<DeactivateUserResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = deactivateUserSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid input",
    }
  }

  const admin = createAdminClient()

  const { data: target, error: fetchError } = await fetchTargetUser(
    admin,
    appUser.orgId,
    parsed.data.userId
  )

  if (fetchError) {
    return { success: false, error: fetchError }
  }
  if (!target) {
    return { success: false, error: "User not found" }
  }

  const { count: adminCount, error: countError } = await countOrgAdmins(
    admin,
    appUser.orgId
  )
  if (countError) {
    return { success: false, error: countError }
  }

  const guard = assertCanDeactivate(
    toActorGuardUser(appUser),
    toGuardUser(target),
    buildGuardContext(adminCount)
  )
  if (!guard.ok) {
    return { success: false, error: guard.message }
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ is_active: false })
    .eq("id", target.id)
    .eq("org_id", appUser.orgId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // admin.signOut(jwt, scope) requires the user's JWT, not their user ID
  // (@supabase/supabase-js v2.103). Session enforcement relies on is_active=false
  // with getServerAuth signing out inactive profiles and sign-in rejecting them.

  revalidatePath(paths.organisationUsers)
  return { success: true }
}
