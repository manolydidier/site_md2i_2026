'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ORANGE } from './constants'
import type { VisibleColumns } from './types'
import { useTokens } from './ui'

export function ColsDropdown({ cols, setCols }: { cols: VisibleColumns; setCols: Dispatch<SetStateAction<VisibleColumns>> }) {
  const t = useTokens()

  const labels: Record<keyof VisibleColumns, string> = {
    image: 'Image',
    title: 'Titre',
    client: 'Client',
    country: 'Pays',
    category: 'Catégorie',
    date: 'Année',
    status: 'Statut',
    createdAt: 'Création',
    actions: 'Actions',
  }

  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9000, background: t.BG_MODAL, border: `1px solid ${t.BORDER_INP}`, borderRadius: 14, padding: 8, minWidth: 200, boxShadow: '0 12px 36px rgba(0,0,0,.25)', animation: 'dropIn .18s ease' }}>
      <div style={{ padding: '6px 10px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.TEXT_DIM, borderBottom: `1px solid ${t.DIVIDER}`, marginBottom: 6 }}>Colonnes visibles</div>
      {(Object.keys(labels) as (keyof VisibleColumns)[]).map((k) => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = t.BG_INPUT }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
          <div onClick={() => setCols((p) => ({ ...p, [k]: !p[k] }))} style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${cols[k] ? ORANGE : t.BORDER_INP}`, background: cols[k] ? ORANGE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {cols[k] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <span style={{ fontSize: 13, color: t.TEXT_MUTED }}>{labels[k]}</span>
        </label>
      ))}
    </div>
  )
}