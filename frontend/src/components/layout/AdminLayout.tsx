import { type ReactElement } from 'react'
import { LogOut } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

import { PosComposerHeader } from './PosComposerHeader'
import { SidebarNav } from './SidebarNav'

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

function isPosComposerPath(pathname: string): boolean {
  if (pathname === '/pos/new') {
    return true
  }
  return /^\/pos\/\d+\/compose$/.test(pathname)
}

export function AdminLayout(): ReactElement {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isPosComposer = isPosComposerPath(location.pathname)

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        <Sidebar collapsible="icon" className="border-r border-border/12 bg-secondary">
          <SidebarNav />
          <SidebarRail />
        </Sidebar>
        <SidebarInset
          className={cn(
            isPosComposer && 'flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          )}
        >
          {isPosComposer ? (
            <PosComposerHeader />
          ) : (
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/15 bg-background px-3 sm:px-4">
              <SidebarTrigger className="shrink-0 md:ms-0" />

              <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  aria-hidden
                >
                  {initialsFromName(user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
                  {user?.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border border-border/15 bg-card"
                onClick={() => void logout()}
              >
                <LogOut className="size-4 sm:mr-1" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </header>
          )}

          <div
            className={cn(
              isPosComposer
                ? 'flex h-full min-h-0 flex-1 flex-col p-0'
                : 'flex-1 p-4 sm:p-6 lg:p-8',
            )}
          >
            <div
              className={cn(
                isPosComposer
                  ? 'flex h-full min-h-0 min-w-0 flex-1 flex-col'
                  : 'mx-auto w-full max-w-6xl',
              )}
            >
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
