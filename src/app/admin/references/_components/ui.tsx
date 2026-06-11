'use client'

import { useTheme } from '@/app/context/ThemeContext'
import { ORANGE, ORANGE_DARK } from './constants'

export function useTokens() {
  const { dark } = useTheme()

  return {
    dark,
    BG_CARD: dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)',
    BG_MODAL: dark ? '#111116' : '#ffffff',
    BG_DRAWER: dark ? '#0d0d12' : '#f8f6f2',
    BG_INPUT: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    BG_BTN: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    BORDER: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    BORDER_INP: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.12)',
    BORDER_MOD: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)',
    TEXT_MAIN: dark ? '#f0ede8' : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.45)',
    TEXT_DIM: dark ? 'rgba(255,255,255,.26)' : 'rgba(0,0,0,.3)',
    TEXT_LABEL: dark ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.38)',
    TEXT_SECTION: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)',
    ROW_HOVER: dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.025)',
    ROW_SEL: dark ? 'rgba(239,159,39,.05)' : 'rgba(239,159,39,.07)',
    SCROLLBAR: dark ? 'rgba(239,159,39,.2)' : 'rgba(239,159,39,.35)',
    BTN_TEXT: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)',
    BTN_BORDER: dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.1)',
    CANCEL_CLR: dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)',
    DIVIDER: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)',
    SPIN_TRACK: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    EMPTY_ICON: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.15)',
    HEADER_SUB: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.38)',
  }
}

export function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'warn' }) {
  const bg = type === 'ok' ? 'rgba(29,158,117,.95)' : type === 'warn' ? 'rgba(245,166,35,.95)' : 'rgba(226,75,74,.95)'
  const icon = type === 'ok' ? '✓' : type === 'warn' ? '⚠' : '✕'

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, background: bg, color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.35)', animation: 'toastIn .22s ease', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {msg}
    </div>
  )
}

export function Spinner({ spinTrack }: { spinTrack: string }) {
  return <div style={{ width: 28, height: 28, border: `2.5px solid ${spinTrack}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin .65s linear infinite', margin: '0 auto' }} />
}

export function ConfirmModal({ title, message, danger, confirmLabel = 'Confirmer', onConfirm, onCancel }: { title?: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useTokens()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 20, padding: '2rem', maxWidth: 400, width: '90%', boxShadow: '0 32px 64px rgba(0,0,0,.4)', animation: 'modalIn .22s ease' }}>
        {title && <h3 style={{ color: t.TEXT_MAIN, fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>{title}</h3>}
        <p style={{ color: t.TEXT_MUTED, fontSize: 14, lineHeight: 1.7, margin: '0 0 1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 10, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.CANCEL_CLR, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: danger ? '#e24b4a' : `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}