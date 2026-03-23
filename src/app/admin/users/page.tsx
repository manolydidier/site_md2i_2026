'use client'
// app/admin/users/page.tsx — Version complète avec thème dynamique

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED'
type SortField  = 'createdAt' | 'email' | 'firstName' | 'lastName' | 'lastLoginAt' | 'status'
type SortDir    = 'asc' | 'desc'

type User = {
  id: string; email: string; firstName: string | null; lastName: string | null
  username: string | null; phone: string | null; avatarUrl: string | null
  status: UserStatus; emailVerified: boolean
  lastLoginAt: string | null; createdAt: string
  userRoles: { role: { id: string; name: string; code: string } }[]
}

type Pagination = { page: number; limit: number; total: number; totalPages: number }

// ─── Constantes ───────────────────────────────────────────────────────────────
const ORANGE      = '#EF9F27'
const ORANGE_DARK = '#c97d15'

const STATUS_CFG: Record<UserStatus, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE:    { label: 'Actif',      color: '#1D9E75', bg: 'rgba(29,158,117,.12)',  dot: '#1D9E75' },
  SUSPENDED: { label: 'Suspendu',   color: '#f5a623', bg: 'rgba(245,166,35,.12)', dot: '#f5a623' },
  PENDING:   { label: 'En attente', color: '#4fa3e0', bg: 'rgba(79,163,224,.12)', dot: '#4fa3e0' },
  DELETED:   { label: 'Supprimé',   color: '#e24b4a', bg: 'rgba(226,75,74,.12)',  dot: '#e24b4a' },
}

const SORT_LABELS: Record<SortField, string> = {
  createdAt: 'Date création', email: 'Email', firstName: 'Prénom',
  lastName: 'Nom', lastLoginAt: 'Dernière connexion', status: 'Statut',
}

const LIMIT_OPTIONS = [10, 20, 50, 100]

const VISIBLE_COLS_DEFAULT = {
  avatar: true, name: true, email: true, phone: false,
  role: true, status: true, emailVerified: false,
  lastLogin: true, createdAt: false, actions: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null, withTime = false) {
  if (!d) return 'Jamais'
  const dt = new Date(d)
  return withTime
    ? dt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(u: User) {
  if (u.firstName || u.lastName) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
  return u.email[0].toUpperCase()
}

function fullName(u: User) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useTokens() {
  const { dark } = useTheme()
  return {
    dark,
    BG_CARD:     dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)',
    BG_MODAL:    dark ? '#111116'                : '#ffffff',
    BG_DRAWER:   dark ? '#0d0d12'               : '#f8f6f2',
    BG_INPUT:    dark ? 'rgba(255,255,255,.04)'  : 'rgba(0,0,0,.04)',
    BG_BTN:      dark ? 'rgba(255,255,255,.06)'  : 'rgba(0,0,0,.05)',
    BORDER:      dark ? 'rgba(255,255,255,.07)'  : 'rgba(0,0,0,.09)',
    BORDER_INP:  dark ? 'rgba(255,255,255,.1)'   : 'rgba(0,0,0,.12)',
    BORDER_MOD:  dark ? 'rgba(255,255,255,.1)'   : 'rgba(0,0,0,.1)',
    TEXT_MAIN:   dark ? '#f0ede8'                : '#1a1918',
    TEXT_MUTED:  dark ? 'rgba(255,255,255,.42)'  : 'rgba(0,0,0,.45)',
    TEXT_DIM:    dark ? 'rgba(255,255,255,.26)'  : 'rgba(0,0,0,.3)',
    TEXT_LABEL:  dark ? 'rgba(255,255,255,.34)'  : 'rgba(0,0,0,.38)',
    TEXT_SECTION:dark ? 'rgba(255,255,255,.22)'  : 'rgba(0,0,0,.25)',
    ROW_HOVER:   dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.025)',
    ROW_SEL:     dark ? 'rgba(239,159,39,.05)'   : 'rgba(239,159,39,.07)',
    SCROLLBAR:   dark ? 'rgba(239,159,39,.2)'    : 'rgba(239,159,39,.35)',
    BTN_TEXT:    dark ? 'rgba(255,255,255,.55)'  : 'rgba(0,0,0,.5)',
    BTN_BORDER:  dark ? 'rgba(255,255,255,.09)'  : 'rgba(0,0,0,.1)',
    CANCEL_CLR:  dark ? 'rgba(255,255,255,.5)'   : 'rgba(0,0,0,.45)',
    DIVIDER:     dark ? 'rgba(255,255,255,.05)'  : 'rgba(0,0,0,.06)',
    SPIN_TRACK:  dark ? 'rgba(255,255,255,.08)'  : 'rgba(0,0,0,.08)',
    EMPTY_ICON:  dark ? 'rgba(255,255,255,.2)'   : 'rgba(0,0,0,.15)',
    HEADER_SUB:  dark ? 'rgba(255,255,255,.35)'  : 'rgba(0,0,0,.38)',
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'warn' }) {
  const bg = type === 'ok' ? 'rgba(29,158,117,.95)' : type === 'warn' ? 'rgba(245,166,35,.95)' : 'rgba(226,75,74,.95)'
  const icon = type === 'ok' ? '✓' : type === 'warn' ? '⚠' : '✕'
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, background: bg, color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.35)', animation: 'toastIn .22s ease', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {msg}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ spinTrack }: { spinTrack: string }) {
  return <div style={{ width: 28, height: 28, border: `2.5px solid ${spinTrack}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin .65s linear infinite', margin: '0 auto' }} />
}

// ─── Access Denied ────────────────────────────────────────────────────────────
function AccessDenied({ code }: { code: 401 | 403 }) {
  const t = useTokens()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center', padding: '2rem' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: code === 401 ? 'rgba(79,163,224,.08)' : 'rgba(226,75,74,.08)', border: `1.5px solid ${code === 401 ? 'rgba(79,163,224,.22)' : 'rgba(226,75,74,.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {code === 401
          ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4fa3e0" strokeWidth="1.7"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          : <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e24b4a" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        }
      </div>
      <div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: t.TEXT_MAIN }}>{code === 401 ? 'Non authentifié' : 'Accès refusé'}</h2>
        <p style={{ fontSize: 14, color: t.TEXT_MUTED, margin: 0, maxWidth: 380, lineHeight: 1.7 }}>
          {code === 401 ? "Votre session a expiré. Veuillez vous reconnecter." : "Vous n'avez pas les permissions nécessaires pour cette page."}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {code === 401 && <a href="/login" style={{ padding: '10px 22px', borderRadius: 11, background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Se connecter</a>}
        <a href="/admin" style={{ padding: '10px 22px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, fontSize: 13, textDecoration: 'none' }}>← Dashboard</a>
      </div>
    </div>
  )
}

// ─── Modal Confirmation ────────────────────────────────────────────────────────
function ConfirmModal({ title, message, danger, confirmLabel = 'Confirmer', onConfirm, onCancel }: {
  title?: string; message: string; danger?: boolean; confirmLabel?: string
  onConfirm: () => void; onCancel: () => void
}) {
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

// ─── Modal Édition ─────────────────────────────────────────────────────────────
function EditModal({ user, roles, onSave, onClose }: {
  user: User; roles: { id: string; name: string; code: string }[]
  onSave: (d: any) => Promise<void>; onClose: () => void
}) {
  const t = useTokens()
  const [form, setForm] = useState({
    firstName: user.firstName ?? '', lastName: user.lastName ?? '',
    email: user.email, phone: user.phone ?? '', username: user.username ?? '',
    status: user.status, roleId: user.userRoles?.[0]?.role?.id ?? '',
    emailVerified: user.emailVerified,
  })
  const [saving, setSaving] = useState(false)
  const s = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_INPUT,
    color: t.TEXT_MAIN,
    fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.3px',
    textTransform: 'uppercase', color: t.TEXT_LABEL, marginBottom: 6,
  }
  const section: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
    color: t.TEXT_SECTION, margin: '0 0 12px',
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 22, padding: '2rem', width: '100%', maxWidth: 540, boxShadow: '0 32px 64px rgba(0,0,0,.4)', animation: 'modalIn .22s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h3 style={{ color: t.TEXT_MAIN, fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>Modifier l'utilisateur</h3>
            <p style={{ color: t.TEXT_DIM, fontSize: 12, margin: '3px 0 0' }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
        </div>

        <p style={section}>Identité</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><label style={lbl}>Prénom</label><input style={inp} value={form.firstName} onChange={e => s('firstName', e.target.value)} /></div>
          <div><label style={lbl}>Nom</label><input style={inp} value={form.lastName} onChange={e => s('lastName', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Nom d'utilisateur</label><input style={inp} value={form.username} onChange={e => s('username', e.target.value)} placeholder="@username" /></div>

        <p style={{ ...section, margin: '16px 0 12px' }}>Contact</p>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => s('email', e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>Téléphone</label><input style={inp} value={form.phone} onChange={e => s('phone', e.target.value)} /></div>

        <p style={{ ...section, margin: '16px 0 12px' }}>Accès</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Rôle</label>
            <select style={{ ...inp }} value={form.roleId} onChange={e => s('roleId', e.target.value)}>
              <option value="">— Aucun rôle —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Statut</label>
            <select style={{ ...inp }} value={form.status} onChange={e => s('status', e.target.value)}>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="PENDING">En attente</option>
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 13px', borderRadius: 10, border: `1px solid ${t.BORDER}`, background: t.BG_INPUT, marginBottom: '1.5rem' }}>
          <div onClick={() => s('emailVerified', !form.emailVerified)} style={{ width: 36, height: 20, borderRadius: 10, background: form.emailVerified ? '#1D9E75' : t.BORDER_INP, position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', top: 3, left: form.emailVerified ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
          </div>
          <span style={{ fontSize: 13, color: t.TEXT_MUTED }}>Email vérifié</span>
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.CANCEL_CLR, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: saving ? .7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <div style={{ width: 13, height: 13, border: `2px solid rgba(255,255,255,.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer détails utilisateur ────────────────────────────────────────────────
function UserDrawer({ user, onClose, onEdit, onDelete, onToggleStatus }: {
  user: User; onClose: () => void
  onEdit: () => void; onDelete: () => void; onToggleStatus: () => void
}) {
  const t  = useTokens()
  const sc   = STATUS_CFG[user.status]
  const role = user.userRoles?.[0]?.role

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ width: 360, background: t.BG_DRAWER, borderLeft: `1px solid ${t.BORDER}`, height: '100%', overflowY: 'auto', animation: 'drawerIn .28s cubic-bezier(.22,1,.36,1)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${t.DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: `0 4px 14px rgba(239,159,39,.3)` }}>
              {initials(user)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.TEXT_MAIN }}>{fullName(user)}</div>
              {user.username && <div style={{ fontSize: 12, color: t.TEXT_DIM }}>@{user.username}</div>}
              <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot }} />
                <span style={{ fontSize: 11.5, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Infos */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
          {[
            { label: 'Email',       value: user.email,                  icon: '✉' },
            { label: 'Téléphone',   value: user.phone,                  icon: '☎' },
            { label: 'Rôle',        value: role?.name,                  icon: '🛡' },
            { label: 'Inscription', value: fmtDate(user.createdAt, true), icon: '📅' },
            { label: 'Connexion',   value: fmtDate(user.lastLoginAt, true), icon: '🔑' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${t.DIVIDER}` }}>
              <span style={{ fontSize: 14, width: 22, flexShrink: 0, opacity: .55 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13.5, color: value ? t.TEXT_MAIN : t.TEXT_DIM }}>{value ?? '—'}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${t.DIVIDER}` }}>
            <span style={{ fontSize: 14, width: 22, flexShrink: 0, opacity: .55 }}>✓</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 2 }}>Email vérifié</div>
              <div style={{ fontSize: 13.5, color: user.emailVerified ? '#1D9E75' : '#e24b4a', fontWeight: 600 }}>{user.emailVerified ? 'Oui' : 'Non'}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier les informations
          </button>
          {user.status !== 'DELETED' && (
            <button onClick={onToggleStatus} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: `1px solid ${user.status === 'ACTIVE' ? 'rgba(245,166,35,.25)' : 'rgba(29,158,117,.25)'}`, background: user.status === 'ACTIVE' ? 'rgba(245,166,35,.07)' : 'rgba(29,158,117,.07)', color: user.status === 'ACTIVE' ? '#f5a623' : '#1D9E75', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>
              {user.status === 'ACTIVE'
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Suspendre l'accès</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Réactiver l'accès</>
              }
            </button>
          )}
          <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(226,75,74,.22)', background: 'rgba(226,75,74,.07)', color: '#e24b4a', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Supprimer le compte
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Colonnes visibles ─────────────────────────────────────────────────────────
function ColsDropdown({ cols, setCols }: {
  cols: typeof VISIBLE_COLS_DEFAULT
  setCols: React.Dispatch<React.SetStateAction<typeof VISIBLE_COLS_DEFAULT>>
}) {
  const t = useTokens()
  const labels: Record<keyof typeof VISIBLE_COLS_DEFAULT, string> = {
    avatar: 'Avatar', name: 'Nom', email: 'Email', phone: 'Téléphone',
    role: 'Rôle', status: 'Statut', emailVerified: 'Email vérifié',
    lastLogin: 'Dernière connexion', createdAt: 'Date création', actions: 'Actions',
  }
  return (
    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200, background: t.BG_MODAL, border: `1px solid ${t.BORDER_INP}`, borderRadius: 14, padding: '8px', minWidth: 200, boxShadow: '0 12px 36px rgba(0,0,0,.25)', animation: 'dropIn .18s ease' }}>
      <div style={{ padding: '6px 10px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.TEXT_DIM, borderBottom: `1px solid ${t.DIVIDER}`, marginBottom: 6 }}>Colonnes visibles</div>
      {(Object.keys(labels) as (keyof typeof VISIBLE_COLS_DEFAULT)[]).map(k => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', transition: 'background .14s' }}
          onMouseEnter={e => (e.currentTarget.style.background = t.BG_INPUT)}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <div onClick={() => setCols(p => ({ ...p, [k]: !p[k] }))} style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${cols[k] ? ORANGE : t.BORDER_INP}`, background: cols[k] ? ORANGE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
            {cols[k] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <span style={{ fontSize: 13, color: t.TEXT_MUTED }}>{labels[k]}</span>
        </label>
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function UsersPage() {
  const { data: session } = useSession()
  const t = useTokens()

  // Data
  const [users,       setUsers]       = useState<User[]>([])
  const [pagination,  setPagination]  = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [roles,       setRoles]       = useState<{ id: string; name: string; code: string }[]>([])
  const [loading,     setLoading]     = useState(true)
  const [accessError, setAccessError] = useState<401 | 403 | null>(null)

  // Filtres & tri
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [page,     setPage]     = useState(1)
  const [limit,    setLimit]    = useState(20)
  const [sortBy,   setSortBy]   = useState<SortField>('createdAt')
  const [sortDir,  setSortDir]  = useState<SortDir>('desc')

  // Sélection multiple
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Colonnes visibles
  const [cols, setCols] = useState(VISIBLE_COLS_DEFAULT)
  const [showColsPicker, setShowColsPicker] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  // UI
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null)
  const [editUser,    setEditUser]    = useState<User | null>(null)
  const [detailUser,  setDetailUser]  = useState<User | null>(null)
  const [confirm,     setConfirm]     = useState<{ title?: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void } | null>(null)

  // ── Fermer dropdown colonnes au clic extérieur ────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setShowColsPicker(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ── Charger rôles ─────────────────────────────────────────────────────────
  useEffect(() => {
  api.get('/api/roles')
    .then(r => {
      console.log('roles reçus:', r.data)  // ← vérifiez ici
      setRoles(r.data?.data ?? r.data ?? [])
    })
    .catch(console.error)
}, [])

  // ── Charger utilisateurs ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true); setAccessError(null)
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit), sortBy, sortDir,
        ...(search   && { search }),
        ...(status   && { status }),
        ...(roleCode && { role: roleCode }),
      })
      const res = await api.get(`/api/users?${p}`)
      setUsers(res.data.data)
      setPagination(res.data.pagination)
      setSelected(new Set())
    } catch (err: any) {
      const code = err?.response?.status
      if (code === 401 || code === 403) setAccessError(code)
      else showToast('Erreur lors du chargement', 'err')
    }
    setLoading(false)
  }, [page, limit, search, status, roleCode, sortBy, sortDir])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(1) }, [search, status, roleCode, limit, sortBy, sortDir])

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg: string, type: 'ok' | 'err' | 'warn' = 'ok') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

  // ── Tri cliquable ─────────────────────────────────────────────────────────
  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: .25 }}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
    return sortDir === 'asc'
      ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
  }

  // ── Sélection ─────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === users.length ? new Set() : new Set(users.map(u => u.id)))
  const allSelected = users.length > 0 && selected.size === users.length
  const someSelected = selected.size > 0

  // ── Actions individuelles ─────────────────────────────────────────────────
  async function handleStatusToggle(user: User) {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setConfirm({
      title:        next === 'SUSPENDED' ? 'Suspendre l\'utilisateur' : 'Réactiver l\'utilisateur',
      message:      `Voulez-vous vraiment ${next === 'ACTIVE' ? 'réactiver' : 'suspendre'} le compte de ${fullName(user)} ?`,
      confirmLabel: next === 'ACTIVE' ? 'Réactiver' : 'Suspendre',
      onConfirm:    async () => {
        setConfirm(null)
        try {
          await api.patch(`/api/users/${user.id}`, { status: next })
          showToast(`${fullName(user)} ${next === 'ACTIVE' ? 'réactivé' : 'suspendu'}`)
          fetchUsers()
          if (detailUser?.id === user.id) setDetailUser(null)
        } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur', 'err') }
      },
    })
  }

  async function handleDelete(user: User) {
    setConfirm({
      title:        'Supprimer le compte',
      message:      `Supprimer définitivement le compte de ${fullName(user)} (${user.email}) ? Cette action est irréversible.`,
      danger:       true,
      confirmLabel: 'Supprimer',
      onConfirm:    async () => {
        setConfirm(null)
        try {
          await api.delete(`/api/users/${user.id}`)
          showToast(`${fullName(user)} supprimé`)
          fetchUsers()
          if (detailUser?.id === user.id) setDetailUser(null)
        } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur', 'err') }
      },
    })
  }

  async function handleEdit(data: any) {
    if (!editUser) return
    try {
      await api.put(`/api/users/${editUser.id}`, data)
      showToast('Utilisateur mis à jour')
      setEditUser(null)
      fetchUsers()
    } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur de mise à jour', 'err') }
  }

  // ── Actions groupées ──────────────────────────────────────────────────────
  async function handleBulkStatus(next: 'ACTIVE' | 'SUSPENDED') {
    const ids = [...selected].filter(id => users.find(u => u.id === id)?.id !== session?.user?.id)
    if (!ids.length) { showToast('Aucun utilisateur sélectionnable', 'warn'); return }
    setConfirm({
      title:        `${next === 'ACTIVE' ? 'Réactiver' : 'Suspendre'} ${ids.length} utilisateur(s)`,
      message:      `Êtes-vous sûr de vouloir ${next === 'ACTIVE' ? 'réactiver' : 'suspendre'} les ${ids.length} utilisateur(s) sélectionné(s) ?`,
      confirmLabel: `${next === 'ACTIVE' ? 'Réactiver' : 'Suspendre'} tout`,
      onConfirm:    async () => {
        setConfirm(null)
        try {
          await Promise.all(ids.map(id => api.patch(`/api/users/${id}`, { status: next })))
          showToast(`${ids.length} utilisateur(s) ${next === 'ACTIVE' ? 'réactivé(s)' : 'suspendu(s)'}`)
          fetchUsers()
        } catch { showToast('Erreur lors de l\'action groupée', 'err') }
      },
    })
  }

  async function handleBulkDelete() {
    const ids = [...selected].filter(id => id !== session?.user?.id)
    if (!ids.length) { showToast('Aucun utilisateur sélectionnable', 'warn'); return }
    setConfirm({
      title:        `Supprimer ${ids.length} utilisateur(s)`,
      message:      `Supprimer définitivement ${ids.length} utilisateur(s) ? Cette action est irréversible.`,
      danger:       true,
      confirmLabel: 'Tout supprimer',
      onConfirm:    async () => {
        setConfirm(null)
        try {
          await Promise.all(ids.map(id => api.delete(`/api/users/${id}`)))
          showToast(`${ids.length} utilisateur(s) supprimé(s)`)
          fetchUsers()
        } catch { showToast('Erreur lors de la suppression', 'err') }
      },
    })
  }

  // ── Styles dynamiques ──────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: t.BG_CARD,
    border: `1px solid ${t.BORDER}`,
    borderRadius: 18,
    overflow: 'hidden',
  }
  const inp: React.CSSProperties = {
    padding: '9px 13px', borderRadius: 11,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_INPUT,
    color: t.TEXT_MAIN,
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }
  const btn = (bg = ORANGE, clr = '#fff', extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
    background: bg, color: clr,
    display: 'flex', alignItems: 'center', gap: 6, ...extra,
  })
  const th: React.CSSProperties = {
    padding: '12px 14px', textAlign: 'left',
    fontSize: 10, fontWeight: 700, letterSpacing: '1px',
    textTransform: 'uppercase', color: t.TEXT_DIM,
    whiteSpace: 'nowrap', userSelect: 'none',
  }

  if (accessError) return <AccessDenied code={accessError} />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes toastIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn  { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes dropIn   { from{opacity:0;transform:translateY(-6px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .urow:hover { background: ${t.ROW_HOVER} !important; }
        .urow.sel   { background: ${t.ROW_SEL}   !important; }
        .abtn { transition: opacity .15s, transform .14s; }
        .abtn:hover { opacity: .75; transform: scale(.95); }
        .th-sort { cursor: pointer; transition: color .15s; }
        .th-sort:hover { color: ${t.TEXT_MAIN} !important; }
        select option { background: ${t.BG_MODAL}; color: ${t.TEXT_MAIN}; }
        input[type=checkbox] { accent-color: ${ORANGE}; width: 15px; height: 15px; cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${t.SCROLLBAR}; border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', sans-serif", color: t.TEXT_MAIN }}>

        {/* ── Toast ── */}
        {toast && <Toast {...toast} />}

        {/* ── Modales ── */}
        {confirm    && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
        {editUser   && <EditModal user={editUser} roles={roles} onSave={handleEdit} onClose={() => setEditUser(null)} />}
        {detailUser && <UserDrawer user={detailUser} onClose={() => setDetailUser(null)} onEdit={() => { setEditUser(detailUser); setDetailUser(null) }} onDelete={() => handleDelete(detailUser)} onToggleStatus={() => handleStatusToggle(detailUser)} />}

        {/* ── Header ── */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.03em', color: t.TEXT_MAIN }}>Utilisateurs</h1>
            <p style={{ color: t.HEADER_SUB, fontSize: 13, margin: '4px 0 0', fontWeight: 300 }}>
              {loading ? '…' : `${pagination.total} utilisateur${pagination.total !== 1 ? 's' : ''} au total`}
            </p>
          </div>
        </div>

        {/* ── Barre filtres + outils ── */}
        <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Recherche */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.TEXT_DIM, pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ ...inp, paddingLeft: 36, width: '100%' }} placeholder="Rechercher nom, email, username…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Statut */}
            <select style={{ ...inp }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              {(Object.keys(STATUS_CFG) as UserStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>
              ))}
            </select>

            {/* Rôle */}
            <select style={{ ...inp }} value={roleCode} onChange={e => setRoleCode(e.target.value)}>
              <option value="">Tous les rôles</option>
              {roles.map(r => <option key={r.id} value={r.code}>{r.name}</option>)}
            </select>

            {/* Tri */}
            <select style={{ ...inp }} value={`${sortBy}:${sortDir}`} onChange={e => { const [f, d] = e.target.value.split(':'); setSortBy(f as SortField); setSortDir(d as SortDir) }}>
              {(Object.keys(SORT_LABELS) as SortField[]).flatMap(f => [
                <option key={`${f}:asc`}  value={`${f}:asc`} >{SORT_LABELS[f]} ↑</option>,
                <option key={`${f}:desc`} value={`${f}:desc`}>{SORT_LABELS[f]} ↓</option>,
              ])}
            </select>

            {/* Limite */}
            <select style={{ ...inp, minWidth: 80 }} value={limit} onChange={e => setLimit(Number(e.target.value))}>
              {LIMIT_OPTIONS.map(l => <option key={l} value={l}>{l} / page</option>)}
            </select>

            {/* Colonnes */}
            <div ref={colsRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowColsPicker(v => !v)} style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Colonnes
              </button>
              {showColsPicker && <ColsDropdown cols={cols} setCols={setCols} />}
            </div>

            {/* Reset filtres */}
            {(search || status || roleCode) && (
              <button onClick={() => { setSearch(''); setStatus(''); setRoleCode('') }} style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}` }}>
                Réinitialiser ×
              </button>
            )}
          </div>

          {/* ── Barre actions groupées ── */}
          {someSelected && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button onClick={() => handleBulkStatus('SUSPENDED')} style={{ ...btn('rgba(245,166,35,.1)', '#f5a623'), border: '1px solid rgba(245,166,35,.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Suspendre
              </button>
              <button onClick={() => handleBulkStatus('ACTIVE')} style={{ ...btn('rgba(29,158,117,.1)', '#1D9E75'), border: '1px solid rgba(29,158,117,.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Réactiver
              </button>
              <button onClick={handleBulkDelete} style={{ ...btn('rgba(226,75,74,.1)', '#e24b4a'), border: '1px solid rgba(226,75,74,.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Supprimer
              </button>
              <button onClick={() => setSelected(new Set())} style={{ ...btn('none', t.TEXT_MUTED), marginLeft: 'auto' }}>
                Désélectionner tout
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div style={card}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <Spinner spinTrack={t.SPIN_TRACK} />
              <p style={{ marginTop: 14, fontSize: 13 }}>Chargement…</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ display: 'block', margin: '0 auto 14px', opacity: .3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p style={{ fontSize: 14, margin: 0 }}>Aucun utilisateur trouvé</p>
              {(search || status || roleCode) && <button onClick={() => { setSearch(''); setStatus(''); setRoleCode('') }} style={{ marginTop: 12, ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}`, margin: '12px auto 0' }}>Réinitialiser les filtres</button>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.BORDER}` }}>
                    <th style={{ ...th, width: 44, paddingRight: 0 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    {cols.avatar && <th style={th}></th>}
                    {cols.name  && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('firstName')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Nom <SortIcon field="firstName" /></span></th>}
                    {cols.email && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('email')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Email <SortIcon field="email" /></span></th>}
                    {cols.phone && <th style={th}>Téléphone</th>}
                    {cols.role  && <th style={th}>Rôle</th>}
                    {cols.status && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('status')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Statut <SortIcon field="status" /></span></th>}
                    {cols.emailVerified && <th style={th}>Email vérifié</th>}
                    {cols.lastLogin && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('lastLoginAt')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Dernière connexion <SortIcon field="lastLoginAt" /></span></th>}
                    {cols.createdAt && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('createdAt')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Inscription <SortIcon field="createdAt" /></span></th>}
                    {cols.actions && <th style={{ ...th, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const sc     = STATUS_CFG[user.status] ?? STATUS_CFG.PENDING
                    const role   = user.userRoles?.[0]?.role
                    const isSelf = user.id === session?.user?.id
                    const isSel  = selected.has(user.id)

                    return (
                      <tr key={user.id} className={`urow${isSel ? ' sel' : ''}`} style={{ borderBottom: `1px solid ${t.DIVIDER}`, transition: 'background .13s', cursor: 'pointer' }}>
                        {/* Checkbox */}
                        <td style={{ padding: '13px 8px 13px 14px' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(user.id)} />
                        </td>

                        {/* Avatar */}
                        {cols.avatar && (
                          <td style={{ padding: '13px 4px' }} onClick={() => setDetailUser(user)}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: `0 2px 8px rgba(239,159,39,.22)` }}>
                              {initials(user)}
                            </div>
                          </td>
                        )}

                        {/* Nom */}
                        {cols.name && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailUser(user)}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: t.TEXT_MAIN, whiteSpace: 'nowrap' }}>{fullName(user)}</div>
                            {user.username && <div style={{ fontSize: 11.5, color: t.TEXT_DIM }}>@{user.username}</div>}
                            {isSelf && <span style={{ fontSize: 9, color: ORANGE, fontWeight: 800, letterSpacing: '.6px', background: 'rgba(239,159,39,.12)', padding: '1px 6px', borderRadius: 4 }}>VOUS</span>}
                          </td>
                        )}

                        {/* Email */}
                        {cols.email && (
                          <td style={{ padding: '13px 14px', fontSize: 13, color: t.TEXT_MUTED, whiteSpace: 'nowrap' }} onClick={() => setDetailUser(user)}>
                            {user.email}
                          </td>
                        )}

                        {/* Téléphone */}
                        {cols.phone && (
                          <td style={{ padding: '13px 14px', fontSize: 13, color: t.TEXT_MUTED, whiteSpace: 'nowrap' }} onClick={() => setDetailUser(user)}>
                            {user.phone ?? '—'}
                          </td>
                        )}

                        {/* Rôle */}
                        {cols.role && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailUser(user)}>
                            {role
                              ? <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 20, background: 'rgba(239,159,39,.11)', color: ORANGE, fontWeight: 600, border: '1px solid rgba(239,159,39,.2)', whiteSpace: 'nowrap' }}>{role.name}</span>
                              : <span style={{ fontSize: 12, color: t.TEXT_DIM }}>—</span>
                            }
                          </td>
                        )}

                        {/* Statut */}
                        {cols.status && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailUser(user)}>
                            <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                              {sc.label}
                            </span>
                          </td>
                        )}

                        {/* Email vérifié */}
                        {cols.emailVerified && (
                          <td style={{ padding: '13px 14px', textAlign: 'center' }} onClick={() => setDetailUser(user)}>
                            {user.emailVerified
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.EMPTY_ICON} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            }
                          </td>
                        )}

                        {/* Dernière connexion */}
                        {cols.lastLogin && (
                          <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDetailUser(user)}>
                            {fmtDate(user.lastLoginAt)}
                          </td>
                        )}

                        {/* Date inscription */}
                        {cols.createdAt && (
                          <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDetailUser(user)}>
                            {fmtDate(user.createdAt)}
                          </td>
                        )}

                        {/* Actions */}
                        {cols.actions && (
                          <td style={{ padding: '13px 14px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                              <button className="abtn" onClick={() => setDetailUser(user)} title="Voir les détails"
                                style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>

                              <button className="abtn" onClick={() => setEditUser(user)} title="Modifier"
                                style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>

                              {!isSelf && user.status !== 'DELETED' && (
                                <button className="abtn" onClick={() => handleStatusToggle(user)}
                                  title={user.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                                  style={{ ...btn('none', user.status === 'ACTIVE' ? '#f5a623' : '#1D9E75'), border: `1px solid ${user.status === 'ACTIVE' ? 'rgba(245,166,35,.25)' : 'rgba(29,158,117,.25)'}`, background: user.status === 'ACTIVE' ? 'rgba(245,166,35,.08)' : 'rgba(29,158,117,.08)', padding: '6px 9px' }}>
                                  {user.status === 'ACTIVE'
                                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  }
                                </button>
                              )}

                              {!isSelf && (
                                <button className="abtn" onClick={() => handleDelete(user)} title="Supprimer"
                                  style={{ ...btn('rgba(226,75,74,.08)', '#e24b4a'), border: '1px solid rgba(226,75,74,.2)', padding: '6px 9px' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && pagination.totalPages > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: t.TEXT_DIM }}>
                Page {page} / {pagination.totalPages} — {pagination.total} résultat{pagination.total !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(1)} title="Première page"
                  style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '7px 10px' }}>
                  «
                </button>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '7px 11px' }}>
                  ‹
                </button>
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, pagination.totalPages - 6))
                  const p = start + i
                  if (p > pagination.totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ ...btn(p === page ? ORANGE : t.BG_BTN, p === page ? '#fff' : t.TEXT_MAIN), border: `1.5px solid ${p === page ? 'transparent' : t.BORDER}`, minWidth: 34, padding: '7px 4px', justifyContent: 'center', fontWeight: p === page ? 700 : 500 }}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                  style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', padding: '7px 11px' }}>
                  ›
                </button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)} title="Dernière page"
                  style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', padding: '7px 10px' }}>
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}