import { type ReactElement, type ReactNode, useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'default' | 'destructive'
  /** When true, disables cancel / overlay dismiss (still allow explicit cancel if not busy). */
  pending?: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Replaces `window.confirm` with an accessible shadcn `Dialog` (explicit Cancel / Confirm).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'default',
  pending: pendingProp = false,
  onConfirm,
}: ConfirmDialogProps): ReactElement {
  const [internalBusy, setInternalBusy] = useState(false)
  const busy = pendingProp || internalBusy

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true)
      } else if (!busy) {
        onOpenChange(false)
      }
    },
    [busy, onOpenChange],
  )

  const handleConfirm = useCallback(async () => {
    setInternalBusy(true)
    try {
      await Promise.resolve(onConfirm())
    } finally {
      setInternalBusy(false)
    }
  }, [onConfirm])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideClose className="max-w-md gap-0 p-0 sm:max-w-md">
        <DialogHeader className="space-y-2 px-6 pb-2 pt-6 text-start">
          <DialogTitle>{title}</DialogTitle>
          {description != null && description !== '' ? (
            <DialogDescription asChild>
              <div className="text-sm text-muted">{description}</div>
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Confirm this action.</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={busy}
            className={cn(
              confirmVariant === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:brightness-95 active:brightness-90',
            )}
            onClick={() => void handleConfirm()}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
