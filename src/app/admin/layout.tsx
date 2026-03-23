'use client'
import { useSession } from 'next-auth/react'
import { useRouter }  from 'next/navigation'
import { useEffect }  from 'react'
import AdminSidebar   from '../components/AdminNavbar'
import { SidebarProvider, useSidebar } from '../context/SidebarContext'
import { useTheme } from '../context/ThemeContext'  // ← ajouter

function AdminContent({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useSidebar()
  const { dark } = useTheme()  // ← ajouter

  return (
    <main style={{
      marginLeft:  sidebarWidth,
      minHeight:   '100vh',
      background:  dark ? '#060608' : '#f0ede8',  // ← dynamique
      color:       dark ? '#e8e6f0' : '#1a1918',  // ← dynamique
      transition:  'margin-left .28s cubic-bezier(.22,1,.36,1), background .3s, color .3s',
    }}>
      <div style={{ padding: '2rem' }}>
        {children}
      </div>
    </main>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { dark } = useTheme()  // ← ajouter pour le loading screen
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: dark ? '#060608' : '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2.5px solid rgba(255,255,255,.08)', borderTopColor: '#EF9F27', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!session) return null

  return (
    <SidebarProvider>
      <AdminSidebar />
      <AdminContent>{children}</AdminContent>
    </SidebarProvider>
  )
}