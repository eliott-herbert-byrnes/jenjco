import type { AppRole } from "@/lib/auth/types"

export type GuardUser = {
  id: string
  email: string
  role: AppRole
  isActive: boolean
}

export type GuardResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

export type GuardContext = {
  adminCount: number
  demoAdminEmail: string
}

export type InviteInput = {
  email: string
  role: AppRole
}

export type UserUpdateChanges = {
  role?: AppRole
  displayName?: string | null
  departmentId?: string | null
}

function fail(code: string, message: string): GuardResult {
  return { ok: false, code, message }
}

function assertActiveAdmin(actor: GuardUser): GuardResult | null {
  if (actor.role !== "admin") {
    return fail("FORBIDDEN", "Admin access required")
  }
  if (!actor.isActive) {
    return fail("INACTIVE_ACTOR", "Your account is inactive")
  }
  return null
}

function isDemoAdmin(email: string, demoAdminEmail: string): boolean {
  return email.trim().toLowerCase() === demoAdminEmail.trim().toLowerCase()
}

function isLastAdmin(target: GuardUser, adminCount: number): boolean {
  return target.role === "admin" && adminCount <= 1
}

export function assertCanInvite(
  actor: GuardUser,
  _input: InviteInput
): GuardResult {
  const adminError = assertActiveAdmin(actor)
  if (adminError) return adminError
  return { ok: true }
}

export function assertCanUpdateUser(
  actor: GuardUser,
  target: GuardUser,
  changes: UserUpdateChanges,
  ctx: GuardContext
): GuardResult {
  const adminError = assertActiveAdmin(actor)
  if (adminError) return adminError

  if (isDemoAdmin(target.email, ctx.demoAdminEmail)) {
    return fail("DEMO_ADMIN_PROTECTED", "The demo admin account cannot be modified")
  }

  if (
    actor.id === target.id &&
    changes.role !== undefined &&
    changes.role !== target.role
  ) {
    return fail("SELF_ROLE_CHANGE", "You cannot change your own role")
  }

  if (
    target.role === "admin" &&
    changes.role === "viewer" &&
    ctx.adminCount <= 1
  ) {
    return fail("LAST_ADMIN", "Cannot demote the last admin")
  }

  return { ok: true }
}

export function assertCanDeactivate(
  actor: GuardUser,
  target: GuardUser,
  ctx: GuardContext
): GuardResult {
  const adminError = assertActiveAdmin(actor)
  if (adminError) return adminError

  if (actor.id === target.id) {
    return fail("SELF_DEACTIVATE", "You cannot deactivate your own account")
  }

  if (isDemoAdmin(target.email, ctx.demoAdminEmail)) {
    return fail("DEMO_ADMIN_PROTECTED", "The demo admin account cannot be deactivated")
  }

  if (isLastAdmin(target, ctx.adminCount)) {
    return fail("LAST_ADMIN", "Cannot deactivate the last admin")
  }

  return { ok: true }
}

export function assertCanReactivate(
  actor: GuardUser,
  target: GuardUser
): GuardResult {
  const adminError = assertActiveAdmin(actor)
  if (adminError) return adminError

  if (target.isActive) {
    return fail("ALREADY_ACTIVE", "User is already active")
  }

  return { ok: true }
}

export function assertCanRemove(
  actor: GuardUser,
  target: GuardUser,
  ctx: GuardContext
): GuardResult {
  const adminError = assertActiveAdmin(actor)
  if (adminError) return adminError

  if (actor.id === target.id) {
    return fail("SELF_REMOVE", "You cannot remove your own account")
  }

  if (isDemoAdmin(target.email, ctx.demoAdminEmail)) {
    return fail("DEMO_ADMIN_PROTECTED", "The demo admin account cannot be removed")
  }

  if (isLastAdmin(target, ctx.adminCount)) {
    return fail("LAST_ADMIN", "Cannot remove the last admin")
  }

  return { ok: true }
}
