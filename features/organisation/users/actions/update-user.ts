"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { paths } from "@/app/paths"
import { createClient } from "@/lib/supabase/server"

import {
  buildGuardContext,
  countOrgAdmins,
  fetchTargetUser,
  requireAdminActor,
  toActorGuardUser,
  toGuardUser,
  type ActionResult,
} from "../lib/action-helpers"
import { assertCanUpdateUser } from "../lib/user-guards"

const updateUserSchema = z
  .object({
    userId: z.string().uuid(),
    role: z.enum(["admin", "viewer"]).optional(),
    displayName: z.string().max(100).nullable().optional(),
  })
  .refine(
    (data) => data.role !== undefined || data.displayName !== undefined,
    { message: "No changes provided" }
  )

export type UpdateUserResult = ActionResult

export async function updateUser(
  input: z.infer<typeof updateUserSchema>
): Promise<UpdateUserResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid input",
    }
  }

  const { userId, role, displayName } = parsed.data
  const supabase = await createClient()

  const { data: target, error: fetchError } = await fetchTargetUser(
    supabase,
    appUser.orgId,
    userId
  )

  if (fetchError) {
    return { success: false, error: fetchError }
  }
  if (!target) {
    return { success: false, error: "User not found" }
  }

  const { count: adminCount, error: countError } = await countOrgAdmins(
    supabase,
    appUser.orgId
  )
  if (countError) {
    return { success: false, error: countError }
  }

  const changes = {
    ...(role !== undefined ? { role } : {}),
    ...(displayName !== undefined ? { displayName } : {}),
  }

  const guard = assertCanUpdateUser(
    toActorGuardUser(appUser),
    toGuardUser(target),
    changes,
    buildGuardContext(adminCount)
  )
  if (!guard.ok) {
    return { success: false, error: guard.message }
  }

  const updatePayload: {
    role?: "admin" | "viewer"
    display_name?: string | null
  } = {}
  if (role !== undefined) {
    updatePayload.role = role
  }
  if (displayName !== undefined) {
    updatePayload.display_name = displayName
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .eq("org_id", appUser.orgId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath(paths.organisationUsers)
  return { success: true }
}
