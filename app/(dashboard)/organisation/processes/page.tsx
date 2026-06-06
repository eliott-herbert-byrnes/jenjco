import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Processes',
}

export default function ProcessesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <FileText className="size-10 opacity-40" />
      <p className="text-sm">Select a process to view its content</p>
    </div>
  )
}
