import type { ReactElement } from 'react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

import { staffNavItems } from './nav-items'

export function SidebarNav(): ReactElement {
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const navigateAway = (): void => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <>
      <SidebarHeader
        className={cn(
          'flex h-16 shrink-0 flex-row items-center border-b border-sidebar-border p-3',
          'group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center',
        )}
      >
        <div className="min-w-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <div className="truncate font-semibold tracking-tight text-sidebar-foreground">
            <span className="hidden text-lg text-emerald-400 group-data-[collapsible=icon]:inline" title="Burst Tea POS">
              BT
            </span>
            <span className="inline group-data-[collapsible=icon]:hidden">
              <span className="text-emerald-400">Burst Tea</span>
              <span className="block text-[10px] font-normal uppercase tracking-widest text-sidebar-muted">POS Admin</span>
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {staffNavItems.map((item) => {
                const isActive =
                  matchPath({ path: item.to, end: item.to === '/dashboard' }, location.pathname) != null
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        'h-auto min-h-12 !py-2.5 !pl-3 !pr-3 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!min-h-0 group-data-[collapsible=icon]:!p-2',
                        isActive
                          ? 'bg-sidebar-active text-white shadow-sm hover:bg-sidebar-active hover:text-white data-[active=true]:bg-sidebar-active data-[active=true]:text-white'
                          : 'text-sidebar-foreground/90 hover:bg-sidebar-hover',
                      )}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={navigateAway}
                        className="flex w-full items-start gap-3 overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        <item.icon
                          className="mt-0.5 size-5 shrink-0 opacity-95 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-4"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
                          <span className="block truncate text-sm font-medium leading-tight">{item.label}</span>
                          <span className="block truncate text-xs font-normal leading-snug text-sidebar-muted">{item.description}</span>
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <p className="rounded-md bg-black/20 px-3 py-2 text-xs leading-relaxed text-sidebar-muted group-data-[collapsible=icon]:hidden">
          <span className="font-semibold text-sidebar-foreground/90">Staff mode</span> — register flows here. A separate
          customer-facing flow can reuse the same catalog later.
        </p>
        <p className="hidden text-center text-[10px] font-medium text-sidebar-muted group-data-[collapsible=icon]:block" title="Staff mode">
          STF
        </p>
      </SidebarFooter>
    </>
  )
}
