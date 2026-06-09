"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { paths } from "@/app/paths"
import { createAdminClient } from "@/lib/supabase/admin"

import {
  fetchTargetUser,
  requireAdminActor,
  toActorGuardUser,
  toGuardUser,
  type ActionResult,
} from "../lib/action-helpers"
import { assertCanReactivate } from "../lib/user-guards"

const reactivateUserSchema = z.object({
  userId: z.string().uuid(),
})

export type ReactivateUserResult = ActionResult

export async function reactivateUser(
  input: z.infer<typeof reactivateUserSchema>
): Promise<ReactivateUserResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = reactivateUserSchema.safeParse(input)
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

  const guard = assertCanReactivate(
    toActorGuardUser(appUser),
    toGuardUser(target)
  )
  if (!guard.ok) {
    return { success: false, error: guard.message }
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ is_active: true })
    .eq("id", target.id)
    .eq("org_id", appUser.orgId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath(paths.organisationUsers)
  return { success: true }
}
