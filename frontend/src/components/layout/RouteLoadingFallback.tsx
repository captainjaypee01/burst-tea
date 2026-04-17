import type { ReactElement } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown while lazy route chunks load (React `Suspense` fallback).
 */
export function RouteLoadingFallback(): ReactElement {
  return (
    <div className="flex min-h-[40vh] flex-col gap-4 p-6" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-32 w-full max-w-2xl rounded-lg" />
      <p className="text-sm text-muted">Loading…</p>
    </div>
  )
}
