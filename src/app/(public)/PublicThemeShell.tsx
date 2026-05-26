'use client'

import type { ReactNode } from 'react'
import { useTheme } from '@/app/context/ThemeContext'

export default function PublicThemeShell({ children }: { children: ReactNode }) {
  const { dark } = useTheme()

  return (
    <div
      className="public-theme-shell"
      data-theme={dark ? 'dark' : 'light'}
    >
      {children}
    </div>
  )
}
