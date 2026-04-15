import { type ReactElement } from 'react'
import { LogOut } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'

import { SidebarNav } from './SidebarNav'

export function AdminLayout(): ReactElement {
  const { user, logout } = useAuth()

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-dvh w-full bg-background text-foreground">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarNav />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:px-4">
            <SidebarTrigger className="shrink-0 md:ms-0" />

            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
              {user?.email ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-border"
              onClick={() => void logout()}
            >
              <LogOut className="size-4 sm:mr-1" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
