import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Jenjco - Your Workflow Automation Partner",
  description:
    "We help organisations join the automation revolution. By keeping humans in-the-loop, without the loop.",
}

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="absolute mb-8 z-0">
        <Image
          src="/logo.svg"
          alt=""
          width={192}
          height={192}
          className="h-192 w-auto opacity-30"
          aria-hidden="true"
        />
      </div>


      <h1 className="text-center text-4xl font-bold tracking-tight md:text-5xl z-100">
        Your Workflow Automation Partner
      </h1>

      <p className="mt-4 max-w-md text-center text-muted-foreground z-100">
        We help organisations join the automation revolution.
        <br />
        By keeping humans in-the-loop, without the loop.
      </p>
    </main>
  )
}
