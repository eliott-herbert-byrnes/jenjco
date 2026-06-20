import { ThreeScene } from "@/components/three/components/three-scene"
import type { Metadata } from "next"
// import Image from "next/image"

export const metadata: Metadata = {
  title: "Jenjco - Your Workflow Automation Partner",
  description:
    "We help organisations join the automation revolution. By keeping humans in-the-loop, without the loop.",
}

export default function LandingPage() {
  return (
    <main className="relative flex flex-1 flex-col justify-center items-center px-6">
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>


      <h1 className="relative z-10 text-center text-4xl tracking-tight text-neutral-50 md:text-7xl drop-shadow-lg top-0 ">
        Your Workflow Automation Partner
      </h1>

      <p className="mt-2 max-w-md text-center z-100 text-neutral-800">
        Keeping humans in the loop without the loop
      </p>

    </main>
  )
}
