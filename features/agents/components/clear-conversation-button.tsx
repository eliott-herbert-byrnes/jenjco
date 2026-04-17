'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export type ClearConversationButtonProps = {
  disabled?: boolean
  /** Resolve on success; reject after surfacing errors so the dialog can stay open. */
  onConfirm: () => Promise<void>
}

export function ClearConversationButton({ disabled, onConfirm }: ClearConversationButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleClear = async () => {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      /* error feedback is handled by the caller */
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          aria-label="Clear conversation"
          disabled={disabled}
          className="absolute top-4 right-4 z-20 bg-red-600/10 border-red-600 text-red-600 hover:text-red-600 hover:bg-red-600/15"
        >
          <Trash2 />
          {/* Clear */}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This starts a fresh conversation. Previous messages stay in your history but won&apos;t be
            visible here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="outline" disabled={pending} onClick={() => void handleClear()} className='bg-red-600/10 border-red-600 text-red-600 hover:text-red-600 hover:bg-red-600/15'>
            Clear
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
