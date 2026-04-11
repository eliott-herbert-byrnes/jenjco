import type { Metadata } from "next"

import { SignInForm } from "@/features/auth/components/sign-in-form"

export const metadata: Metadata = {
  title: "Sign in",
}

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>
}

export default async function SignInPage({ searchParams }: Props) {
  const { error, next } = await searchParams
  return <SignInForm errorMessage={error ?? null} nextPath={next} />
}
