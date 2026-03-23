'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type ThemeCtx = { dark: boolean; toggleTheme: () => void }

const ThemeContext = createContext<ThemeCtx>({ dark: false, toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') setDark(true)
    else if (saved === 'light') setDark(false)
    else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  useEffect(() => {
    const body = document.body
    body.style.minHeight = '100vh'
    body.style.background = dark ? '#060608' : '#f0ede8'
    body.style.color = dark ? '#e8e6f0' : '#1a1918'
    body.style.transition = 'background .3s, color .3s'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleTheme = () => setDark(d => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}  // ← accolade fermante correcte