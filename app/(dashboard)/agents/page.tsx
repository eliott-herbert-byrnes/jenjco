import type { Metadata } from "next"
import { BotIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: "Agents",
}

export default function AgentsIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <BotIcon className="size-10 opacity-40" />
      <p className="text-sm">Select an agent to start a conversation</p>
    </div>
  )
}
