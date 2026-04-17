"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User as SupabaseAuthUser } from "@supabase/supabase-js"

import { fetchOrganizationByOrgId } from "@/lib/auth/fetch-organization"
import {
  mapUsersProfileRow,
  type UsersProfileRow,
} from "@/lib/auth/map-profile"
import type { AppUser, OrganizationSummary } from "@/lib/auth/types"
import { createClient } from "@/lib/supabase/client"

const PROFILE_SELECT = `
  id,
  org_id,
  email,
  role,
  display_name,
  organizations (
    id,
    name,
    slug
  )
` as const

export type UseUserResult = {
  authUser: SupabaseAuthUser | null
  appUser: AppUser | null
  organization: OrganizationSummary | null
  /** Convenience: `appUser.orgId` when the profile row exists */
  orgId: string | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const AuthContext = createContext<UseUserResult | undefined>(undefined)

function useAuthState(): UseUserResult {
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [organization, setOrganization] = useState<OrganizationSummary | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const syncFromSession = useCallback(async () => {
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user ?? null
    setAuthUser(user)

    if (!user) {
      setAppUser(null)
      setOrganization(null)
      setIsLoading(false)
      return
    }

    const { data: row, error: qErr } = await supabase
      .from("users")
      .select(PROFILE_SELECT)
      .eq("supabase_auth_id", user.id)
      .maybeSingle()

    if (qErr) {
      setError(qErr instanceof Error ? qErr : new Error(String(qErr)))
      setAppUser(null)
      setOrganization(null)
      setIsLoading(false)
      return
    }

    if (!row) {
      setAppUser(null)
      setOrganization(null)
      setIsLoading(false)
      return
    }

    const mapped = mapUsersProfileRow(row as unknown as UsersProfileRow)
    let organization = mapped.organization
    if (!organization && mapped.appUser) {
      organization = await fetchOrganizationByOrgId(
        supabase,
        mapped.appUser.orgId
      )
    }
    setAppUser(mapped.appUser)
    setOrganization(organization)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    queueMicrotask(() => {
      void syncFromSession()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setIsLoading(true)
      setError(null)
      void syncFromSession()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [syncFromSession])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await syncFromSession()
  }, [syncFromSession])

  return {
    authUser,
    appUser,
    organization,
    orgId: appUser?.orgId ?? null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Single subscription for the dashboard shell — wrap layout content with this
 * so `useUser()` consumers share one session + profile load.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Client hook: Supabase session + `public.users` profile and organization.
 * Must be used under {@link AuthProvider} (dashboard layout).
 */
export function useUser(): UseUserResult {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useUser must be used within AuthProvider")
  }
  return ctx
}
