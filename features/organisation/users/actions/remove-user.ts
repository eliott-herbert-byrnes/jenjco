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
import { assertCanRemove } from "../lib/user-guards"

const removeUserSchema = z.object({
  userId: z.string().uuid(),
})

export type RemoveUserResult = ActionResult

/**
 * Permanently deletes the auth user. Cascades public.users via FK and also
 * deletes related conversations (ON DELETE CASCADE).
 */
export async function removeUser(
  input: z.infer<typeof removeUserSchema>
): Promise<RemoveUserResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = removeUserSchema.safeParse(input)
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

  const guard = assertCanRemove(
    toActorGuardUser(appUser),
    toGuardUser(target),
    buildGuardContext(adminCount)
  )
  if (!guard.ok) {
    return { success: false, error: guard.message }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    target.supabase_auth_id
  )

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  revalidatePath(paths.organisationUsers)
  return { success: true }
}
