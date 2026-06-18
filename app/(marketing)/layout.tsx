import { MarketingHeader } from "@/components/marketing-header"
import { getServerAuth } from "@/lib/auth"

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { appUser } = await getServerAuth()
  const isAuthenticated = !!appUser

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader isAuthenticated={isAuthenticated} />
      {children}
    </div>
  )
}
