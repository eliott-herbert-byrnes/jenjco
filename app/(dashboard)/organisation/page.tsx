import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  FileStackIcon,
  NetworkIcon,
  PlugIcon,
  UsersIcon,
} from "lucide-react"

import { paths } from "@/app/paths"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Organisation" }

const ORGANISATION_LINKS = [
  {
    title: "Org Structure",
    description: "Departments and how processes are organised",
    href: paths.orgStructure,
    icon: NetworkIcon,
  },
  {
    title: "Processes",
    description: "Internal procedures and knowledge base",
    href: paths.processes,
    icon: FileStackIcon,
  },
  {
    title: "Users",
    description: "Invite teammates and manage roles",
    href: paths.organisationUsers,
    icon: UsersIcon,
    adminOnly: true,
  },
  {
    title: "Integrations",
    description: "Connected accounts and external services",
    href: paths.integrations,
    icon: PlugIcon,
    adminOnly: true,
  },
] as const

export default async function OrganisationPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Organisation</h1>
        <p className="text-sm text-muted-foreground">
          Structure, processes, people, and connected services
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {ORGANISATION_LINKS.filter(
          (item) => appUser.role === "admin" || !("adminOnly" in item && item.adminOnly)
        ).map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <item.icon className="size-5 text-muted-foreground" />
                  <CardTitle>{item.title}</CardTitle>
                  {"adminOnly" in item && item.adminOnly ? (
                    <Badge variant="secondary">Admin only</Badge>
                  ) : null}
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
