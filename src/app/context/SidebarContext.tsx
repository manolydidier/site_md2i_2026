'use client'
// src/context/SidebarContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export const SIDEBAR_W         = 272
export const SIDEBAR_COLLAPSED = 68
export const MOBILE_BREAKPOINT = 980

type SidebarCtx = {
  collapsed:     boolean
  setCollapsed:  (v: boolean) => void
  isMobile:      boolean
  mobileOpen:    boolean
  setMobileOpen: (v: boolean) => void
  sidebarWidth:  number
}

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false, setCollapsed: () => {},
  isMobile: false, mobileOpen: false, setMobileOpen: () => {},
  sidebarWidth: SIDEBAR_W,
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const sidebarWidth = isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}