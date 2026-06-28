"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { paths } from "@/app/paths"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard]", error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangleIcon className="size-5 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We couldn&apos;t load this page. You can try again, or return to the
            dashboard.
          </CardDescription>
        </CardHeader>
        {process.env.NODE_ENV === "development" && error.message ? (
          <CardContent>
            <p className="rounded-xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          </CardContent>
        ) : null}
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => reset()}>
            <RefreshCwIcon />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href={paths.dashboard}>Back to dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
