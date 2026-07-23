'use client'
// src/app/admin/roles/_components/PermissionsEditorModal.tsx
// Grand modal dédié à l'édition des permissions d'un rôle — point d'entrée
// unique et explicite (bouton "Gérer les permissions"), plutôt qu'un onglet
// caché dans le drawer de détail.

import PermissionMatrix from './PermissionMatrix'

const ORANGE = '#EF9F27'

type Tokens = {
  BG_CARD: string; BG_MODAL: string; BG_INPUT: string; BG_BTN: string
  BORDER: string; BORDER_INP: string; BORDER_MOD: string
  TEXT_MAIN: string; TEXT_MUTED: string; TEXT_DIM: string
  DIVIDER: string; SYS_BG: string; SYS_CLR: string
}

export default function PermissionsEditorModal({
  role,
  onClose,
  tokens: t,
}: {
  role: { id: string; name: string; code: string; isSystem: boolean } | null
  onClose: () => void
  tokens: Tokens
}) {
  if (!role) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 22,
          width: 'min(1240px, 96vw)', height: 'min(880px, 92vh)',
          boxShadow: '0 40px 100px rgba(0,0,0,.5)', animation: 'modalIn .22s ease',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: `1px solid ${t.DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🔐</span>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: t.TEXT_MAIN, fontFamily: "'Syne', sans-serif" }}>
                Permissions — {role.name}
              </h2>
              {role.isSystem && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.SYS_BG, color: t.SYS_CLR, fontWeight: 700, letterSpacing: '.5px' }}>SYSTÈME</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: t.TEXT_MUTED }}>
              Cochez les actions autorisées pour chaque module. Chaque case est enregistrée immédiatement — pas besoin de bouton « Enregistrer ».
            </p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>×</button>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          <PermissionMatrix roleId={role.id} tokens={t} />
        </div>
      </div>
    </div>
  )
}
