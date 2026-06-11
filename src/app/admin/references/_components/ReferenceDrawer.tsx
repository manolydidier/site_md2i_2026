'use client'

import Link from 'next/link'
import { STATUS_CFG } from './constants'
import type { Reference } from './types'
import { useTokens } from './ui'

export function ReferenceDrawer({ reference, onClose, onDelete }: { reference: Reference; onClose: () => void; onDelete: () => void }) {
  const t = useTokens()
  const sc = STATUS_CFG[reference.status]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ width: 420, background: t.BG_DRAWER, borderLeft: `1px solid ${t.BORDER}`, height: '100%', overflowY: 'auto', animation: 'drawerIn .28s cubic-bezier(.22,1,.36,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${t.DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: t.BG_INPUT, border: `1px solid ${t.BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {reference.image ? <img src={reference.image} alt={reference.title} width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, opacity: 0.55 }}>🌍</span>}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.TEXT_MAIN }}>{reference.title}</div>
              <div style={{ fontSize: 12, color: t.TEXT_DIM }}>{reference.slug}</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot }} />
                <span style={{ fontSize: 11.5, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
          {[
            { label: 'Client', value: reference.client, icon: '🏢' },
            { label: 'Pays', value: reference.country, icon: '🌍' },
            { label: 'Catégorie', value: reference.category, icon: '📁' },
            { label: 'Année', value: reference.date, icon: '📅' },
            { label: 'Impact', value: reference.impact || '—', icon: '📈' },
            { label: 'Équipe', value: reference.team || '—', icon: '👥' },
            { label: 'Durée', value: reference.duration || '—', icon: '⏱️' },
            { label: 'Budget', value: reference.budget || '—', icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${t.DIVIDER}` }}>
              <span style={{ fontSize: 14, width: 22, flexShrink: 0, opacity: 0.55 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13.5, color: value !== '—' ? t.TEXT_MAIN : t.TEXT_DIM }}>{value}</div>
              </div>
            </div>
          ))}

          <div style={{ paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 8 }}>Extrait</div>
            <div style={{ fontSize: 13.5, color: t.TEXT_MUTED, lineHeight: 1.7, padding: '12px 14px', borderRadius: 12, background: t.BG_INPUT, border: `1px solid ${t.BORDER}` }}>{reference.excerpt || 'Aucun extrait disponible.'}</div>
          </div>

          {reference.tags.length > 0 && (
            <div style={{ paddingTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {reference.tags.map((tag) => <span key={tag} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: t.BG_BTN, color: '#EF9F27' }}>#{tag}</span>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href={`/admin/references/${reference.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, textDecoration: 'none', fontSize: 13.5, fontWeight: 500 }}>Modifier la référence</Link>
          <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(226,75,74,.22)', background: 'rgba(226,75,74,.07)', color: '#e24b4a', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>Supprimer la référence</button>
        </div>
      </div>
    </div>
  )
}