import { headers } from "next/headers"
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js"

import { paths } from "@/app/paths"
import { DEMO_ADMIN_EMAIL } from "@/features/auth/constants"
import { getServerAuth, type AppUser } from "@/lib/auth"
import type { Database } from "@/lib/database.types"

import type { GuardContext, GuardUser } from "./user-guards"

export type ActionResult =
  | { success: true; inviteLink?: string; emailError?: boolean }
  | { success: false; error: string }

export type TargetUserRow = {
  id: string
  email: string
  role: string
  display_name: string | null
  is_active: boolean
  supabase_auth_id: string
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function toGuardUser(row: {
  id: string
  email: string
  role: string
  is_active: boolean
}): GuardUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role as GuardUser["role"],
    isActive: row.is_active,
  }
}

export function toActorGuardUser(appUser: AppUser): GuardUser {
  return {
    id: appUser.id,
    email: appUser.email,
    role: appUser.role,
    isActive: appUser.isActive,
  }
}

export function buildGuardContext(adminCount: number): GuardContext {
  return { adminCount, demoAdminEmail: DEMO_ADMIN_EMAIL }
}

export async function requireAdminActor(): Promise<
  | { ok: true; appUser: AppUser }
  | { ok: false; result: ActionResult }
> {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return { ok: false, result: { success: false, error: "Unauthorized" } }
  }
  if (appUser.role !== "admin" || !appUser.isActive) {
    return { ok: false, result: { success: false, error: "Forbidden" } }
  }
  return { ok: true, appUser }
}

export async function getAppOrigin(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host")
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  if (!host) {
    throw new Error("Cannot determine application origin for invite redirect")
  }
  return `${proto}://${host}`
}

/** App callback URL with token_hash — avoids PKCE code-verifier requirement of action_link. */
export function buildInviteCallbackLink(
  origin: string,
  hashedToken: string
): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "invite",
  })
  return `${origin}${paths.authCallback}?${params.toString()}`
}

export async function countOrgAdmins(
  supabase: SupabaseClient<Database>,
  orgId: string
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "admin")

  if (error) {
    return { count: 0, error: error.message }
  }
  return { count: count ?? 0, error: null }
}

export async function fetchTargetUser(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string
): Promise<{ data: TargetUserRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, display_name, is_active, supabase_auth_id")
    .eq("org_id", orgId)
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function findAuthUserByEmail(
  admin: SupabaseClient<Database>,
  email: string
): Promise<AuthUser | null> {
  const normalized = normalizeEmail(email)
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      throw error
    }

    const found = data.users.find(
      (user) => user.email && normalizeEmail(user.email) === normalized
    )
    if (found) {
      return found
    }

    if (data.users.length < 1000) {
      return null
    }
    page += 1
  }
}
