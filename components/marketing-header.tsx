"use client"

import Link from "next/link"
import { toast } from "sonner"

import { paths } from "@/app/paths"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type MarketingHeaderProps = {
  isAuthenticated?: boolean
}

const NAV_ITEMS = [
  { label: "Workflow", disabled: true },
  { label: "Partners", disabled: true },
  { label: "Responsibility", disabled: true },
  { label: "Impact", disabled: true },
  { label: "About", disabled: true },
]

export function MarketingHeader({ isAuthenticated }: MarketingHeaderProps) {
  const handleDisabledClick = (label: string) => {
    toast.info(`${label} - Coming soon`)
  }

  return (
    <header className="flex h-15 items-center justify-between px-7">
      <div className="flex items-center gap-8">
        <Link href={paths.home} className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Jenjco"
            width={50}
            height={50}
            className="h-5 w-auto text-foreground"
          />
          <span className="font-semibold">JENJCO</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleDisabledClick(item.label)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {isAuthenticated ? (
        <Button asChild variant="outline" size="sm">
          <Link href={paths.dashboard}>Go to Dashboard</Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={paths.signIn}>Sign in</Link>
        </Button>
      )}
    </header>
  )
}
