'use client'
// src/(permisionGuard)/components/RequireCan.tsx
// Garde de page/section côté client : masque son contenu tant que la
// permission requise n'est pas confirmée. C'est un confort d'UX (évite
// d'afficher une page puis de la faire disparaître, ou des boutons d'action
// inutiles) — la vraie frontière de sécurité reste le guard serveur
// (withPermission) sur les routes API correspondantes.

import type { ReactNode } from 'react'
import { usePermissions } from '../context/PermissionsContext'

function DefaultDenied() {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: 42, marginBottom: 14 }}>🔒</div>
      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Accès refusé</p>
      <p style={{ fontSize: 13, opacity: .6, margin: 0 }}>
        Vous n&apos;avez pas la permission d&apos;accéder à cette section.<br />
        Contactez un administrateur.
      </p>
    </div>
  )
}

export default function RequireCan({
  resource,
  action,
  children,
  fallback,
  loadingFallback = null,
}: {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}) {
  const { can, loading } = usePermissions()

  if (loading) return <>{loadingFallback}</>
  if (!can(resource, action)) return <>{fallback ?? <DefaultDenied />}</>
  return <>{children}</>
}
