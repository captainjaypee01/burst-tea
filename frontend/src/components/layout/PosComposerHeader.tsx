import { type ReactElement, useCallback, useEffect, useState } from 'react'
import { Bell, LogOut, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function initialsFromName(name: string | undefined): string {
  if (!name?.trim()) {
    return '?'
  }
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/** Full POS composer topbar: toggle, user, search, image mode, bell, logout. URL: `q`, `img` (1 | 0). */
export function PosComposerHeader(): ReactElement {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [qDraft, setQDraft] = useState(() => searchParams.get('q') ?? '')

  const setImg = useCallback(
    (on: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (on) {
            next.delete('img')
          } else {
            next.set('img', '0')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const imagesOn = searchParams.get('img') !== '0'

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (qDraft.trim() === '') {
            next.delete('q')
          } else {
            next.set('q', qDraft)
          }
          return next
        },
        { replace: true },
      )
    }, 200)
    return () => {
      window.clearTimeout(t)
    }
  }, [qDraft, setSearchParams])

  return (
    <header className="sticky top-0 z-30 flex shrink-0 flex-col gap-2 border-b border-border/15 bg-background px-3 py-2 sm:flex-row sm:items-center sm:gap-2 sm:py-0 sm:h-14">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:gap-3">
        <SidebarTrigger
          className={cn(
            'size-9 shrink-0 rounded-md border border-border/15 bg-transparent shadow-none hover:bg-secondary/80',
            'text-foreground',
          )}
        />

        <div className="flex min-w-0 items-center gap-3 pl-0.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            aria-hidden
          >
            {initialsFromName(user?.name)}
          </div>
          <div className="min-w-0 flex-1 max-sm:hidden">
            <p className="truncate text-sm font-medium text-foreground">{user?.name ?? 'User'}</p>
            {user?.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
          </div>
        </div>
      </div>

      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={qDraft}
          onChange={(e) => {
            setQDraft(e.target.value)
          }}
          placeholder="Search menu items…"
          className="h-10 border-border/15 bg-card pl-9 pr-3 text-sm"
          aria-label="Search menu items"
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
        <div className="flex items-center gap-1 rounded-full border border-border/15 bg-secondary/60 p-1">
          <button
            type="button"
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              imagesOn ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setImg(true)
            }}
          >
            With images
          </button>
          <button
            type="button"
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              !imagesOn ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => {
              setImg(false)
            }}
          >
            Text only
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0 border-border/15 bg-card"
          aria-label="Notifications"
          onClick={() => {
            toast.message('Notifications', { description: 'No new alerts.' })
          }}
        >
          <Bell className="size-4 text-primary" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border border-border/15 bg-card text-xs text-primary"
          onClick={() => void logout()}
        >
          <LogOut className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  )
}
