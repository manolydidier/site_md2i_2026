// components/NavbarWrapper.tsx  ← le coupable probable
'use client'
import { usePathname } from 'next/navigation'
import PublicNavbar from './PublicNavbar'

export default function NavbarWrapper() {
  const pathname = usePathname()
  
  // Masquer sur /login et /admin
  if (pathname.startsWith('/login') || pathname.startsWith('/admin')) {
    return null
  }
  
  return <PublicNavbar />
}