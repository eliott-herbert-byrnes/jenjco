import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { getServerAuth } from "@/lib/auth"

export default async function AuditPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  redirect(paths.analyticsOverview)
}
