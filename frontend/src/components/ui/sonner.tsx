import type { ComponentProps, ReactElement } from 'react'
import { Toaster as Sonner } from 'sonner'

import { cn } from '@/lib/utils'

type SonnerProps = ComponentProps<typeof Sonner>

/**
 * shadcn-style Sonner host — use `import { toast } from 'sonner'` anywhere in the app.
 */
export function Toaster({ className, ...props }: SonnerProps): ReactElement {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          toast: 'group toast border border-border bg-card text-foreground shadow-lg',
          title: 'text-sm font-semibold text-foreground',
          description: 'text-sm text-muted',
          success: 'border-emerald-200 bg-emerald-50/95',
          error: 'border-red-200 bg-red-50/95',
          warning: 'border-amber-200 bg-amber-50/95',
          info: 'border-border bg-card',
          closeButton: 'border-border bg-card text-foreground',
        },
      }}
      {...props}
    />
  )
}
