'use client'
// src/context/PermissionsContext.tsx
// Charge les permissions une seule fois au montage et les met en cache
// Utiliser dans le layout admin

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { can, canAll, canAny } from '@/(permisionGuard)/lib/permissions'

type PermissionsCtx = {
  permissions: string[]
  loading:     boolean
  can:     (resource: string, action: string)    => boolean
  canAll:  (resource: string, actions: string[]) => boolean
  canAny:  (resource: string, actions: string[]) => boolean
}

const PermissionsContext = createContext<PermissionsCtx>({
  permissions: [],
  loading:     true,
  can:    () => false,
  canAll: () => false,
  canAny: () => false,
})

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) { setLoading(false); return }

    // Charger les permissions depuis l'API
    fetch('/api/me/permissions')
      .then(r => r.json())
      .then(data => {
        setPermissions(data.permissions ?? [])
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false))

  }, [session, status])

  return (
    <PermissionsContext.Provider value={{
      permissions,
      loading,
      can:    (resource, action)  => can(permissions, resource, action),
      canAll: (resource, actions) => canAll(permissions, resource, actions),
      canAny: (resource, actions) => canAny(permissions, resource, actions),
    }}>
      {children}
    </PermissionsContext.Provider>
  )
}

// Hook à utiliser dans les composants
export function usePermissions() {
  return useContext(PermissionsContext)
}

// ── Exemple d'utilisation ─────────────────────────────────────────────────────
/*
// app/admin/layout.tsx
import { PermissionsProvider } from '@/context/PermissionsContext'

export default function AdminLayout({ children }) {
  return (
    <PermissionsProvider>
      <AdminSidebar />
      {children}
    </PermissionsProvider>
  )
}

// Dans un composant admin :
'use client'
import { usePermissions } from '@/context/PermissionsContext'

export default function PostActions() {
  const { can, loading } = usePermissions()

  if (loading) return null

  return (
    <div>
      {can('posts', 'canCreate') && <button>Nouveau post</button>}
      {can('posts', 'canDelete') && <button>Supprimer</button>}
      {can('users', 'canList')   && <button>Voir les users</button>}
    </div>
  )
}
*/