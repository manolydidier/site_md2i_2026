'use client'
// app/admin/roles/page.tsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────
type SpecialPermission = 'NONE' | 'FULL_ACCESS'

type RolePermission = {
  id: string
  canRead: boolean; canCreate: boolean; canUpdate: boolean
  canDelete: boolean; canList: boolean; canExport: boolean
  canApprove: boolean; canManage: boolean
  specialPermission: SpecialPermission
  resource: { id: string; name: string; code: string }
}

type RoleUser = {
  assignedAt: string
  user: { id: string; email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; status: string }
}

type Role = {
  id: string
  name: string
  code: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  rolePermissions: RolePermission[]
  _count: { userRoles: number }
}

type RoleDetail = Role & { userRoles: RoleUser[] }

type Pagination = { page: number; limit: number; total: number; totalPages: number }
type SortField  = 'name' | 'code' | 'createdAt' | 'updatedAt'
type SortDir    = 'asc' | 'desc'

// ─── Constantes ───────────────────────────────────────────────────────────────
const ORANGE      = '#EF9F27'
const ORANGE_DARK = '#c97d15'

const PERM_LABELS: Record<string, string> = {
  canRead: 'Lire', canCreate: 'Créer', canUpdate: 'Modifier',
  canDelete: 'Supprimer', canList: 'Lister', canExport: 'Exporter',
  canApprove: 'Approuver', canManage: 'Gérer',
}
const PERM_KEYS = Object.keys(PERM_LABELS) as (keyof typeof PERM_LABELS)[]

const SORT_LABELS: Record<SortField, string> = {
  name: 'Nom', code: 'Code', createdAt: 'Date création', updatedAt: 'Dernière modif.',
}
const LIMIT_OPTIONS = [10, 20, 50]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function initials(u: RoleUser['user']) {
  if (u.firstName || u.lastName) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
  return u.email[0].toUpperCase()
}
function fullName(u: RoleUser['user']) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useTokens() {
  const { dark } = useTheme()
  return {
    dark,
    BG_CARD:    dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)',
    BG_MODAL:   dark ? '#111116'               : '#ffffff',
    BG_DRAWER:  dark ? '#0d0d12'              : '#f8f6f2',
    BG_INPUT:   dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    BG_BTN:     dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    BG_PERM:    dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
    BORDER:     dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    BORDER_INP: dark ? 'rgba(255,255,255,.1)'  : 'rgba(0,0,0,.12)',
    BORDER_MOD: dark ? 'rgba(255,255,255,.1)'  : 'rgba(0,0,0,.1)',
    TEXT_MAIN:  dark ? '#f0ede8'               : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.45)',
    TEXT_DIM:   dark ? 'rgba(255,255,255,.26)' : 'rgba(0,0,0,.3)',
    TEXT_LABEL: dark ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.38)',
    TEXT_SEC:   dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)',
    ROW_HOVER:  dark ? 'rgba(255,255,255,.025)': 'rgba(0,0,0,.025)',
    ROW_SEL:    dark ? 'rgba(239,159,39,.05)'  : 'rgba(239,159,39,.07)',
    SCROLLBAR:  dark ? 'rgba(239,159,39,.2)'   : 'rgba(239,159,39,.35)',
    BTN_TEXT:   dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)',
    BTN_BORDER: dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.1)',
    CANCEL_CLR: dark ? 'rgba(255,255,255,.5)'  : 'rgba(0,0,0,.45)',
    DIVIDER:    dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)',
    SPIN_TRACK: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    HEADER_SUB: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.38)',
    SYS_BG:     dark ? 'rgba(79,163,224,.1)'   : 'rgba(79,163,224,.08)',
    SYS_CLR:    '#4fa3e0',
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'warn' }) {
  const bg = type === 'ok' ? 'rgba(29,158,117,.95)' : type === 'warn' ? 'rgba(245,166,35,.95)' : 'rgba(226,75,74,.95)'
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, background: bg, color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.35)', animation: 'toastIn .22s ease', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
      <span style={{ fontSize: 15 }}>{type === 'ok' ? '✓' : type === 'warn' ? '⚠' : '✕'}</span> {msg}
    </div>
  )
}

function Spinner({ track }: { track: string }) {
  return <div style={{ width: 28, height: 28, border: `2.5px solid ${track}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin .65s linear infinite', margin: '0 auto' }} />
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

// ─── Modal Créer / Modifier ────────────────────────────────────────────────────
function RoleModal({ role, onSave, onClose }: {
  role: Role | null
  onSave: (d: { name: string; code: string; description: string }) => Promise<void>
  onClose: () => void
}) {
  const t = useTokens()
  const [form, setForm] = useState({
    name:        role?.name        ?? '',
    code:        role?.code        ?? '',
    description: role?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Auto-générer le code depuis le nom si création
  useEffect(() => {
    if (!role && form.name) {
      s('code', form.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''))
    }
  }, [form.name, role])

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name = 'Le nom est requis'
    if (!form.code.trim())  e.code = 'Le code est requis'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT,
    color: t.TEXT_MAIN, fontSize: 13.5, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.3px',
    textTransform: 'uppercase', color: t.TEXT_LABEL, marginBottom: 6,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 22, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 32px 64px rgba(0,0,0,.4)', animation: 'modalIn .22s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <h3 style={{ color: t.TEXT_MAIN, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {role ? 'Modifier le rôle' : 'Créer un rôle'}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nom</label>
            <input style={{ ...inp, borderColor: errors.name ? '#e24b4a' : t.BORDER_INP }} value={form.name} onChange={e => s('name', e.target.value)} placeholder="ex: Administrateur" />
            {errors.name && <p style={{ color: '#e24b4a', fontSize: 11.5, margin: '4px 0 0' }}>{errors.name}</p>}
          </div>

          <div>
            <label style={lbl}>Code</label>
            <input style={{ ...inp, fontFamily: 'monospace', fontSize: 13, borderColor: errors.code ? '#e24b4a' : t.BORDER_INP }} value={form.code} onChange={e => s('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} placeholder="ex: ADMIN" />
            {errors.code && <p style={{ color: '#e24b4a', fontSize: 11.5, margin: '4px 0 0' }}>{errors.code}</p>}
            <p style={{ color: t.TEXT_DIM, fontSize: 11, margin: '4px 0 0' }}>Uniquement lettres majuscules, chiffres et underscore</p>
          </div>

          <div>
            <label style={lbl}>Description <span style={{ color: t.TEXT_DIM, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></label>
            <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.description} onChange={e => s('description', e.target.value)} placeholder="Description du rôle…" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.CANCEL_CLR, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: saving ? .7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />}
            {saving ? 'Enregistrement…' : role ? 'Enregistrer' : 'Créer le rôle'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer Détail Rôle ────────────────────────────────────────────────────────
function RoleDrawer({ roleId, onClose, onEdit, onDelete }: {
  roleId: string; onClose: () => void
  onEdit: (r: Role) => void; onDelete: (r: Role) => void
}) {
  const t = useTokens()
  const [role,    setRole]    = useState<RoleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'permissions' | 'users'>('permissions')

  useEffect(() => {
    setLoading(true)
    api.get(`/api/roles/${roleId}`)
      .then(r => setRole(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roleId])

  const permCount = role?.rolePermissions.length ?? 0
  const userCount = role?._count.userRoles       ?? 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }} />
      <div style={{ width: 420, background: t.BG_DRAWER, borderLeft: `1px solid ${t.BORDER}`, height: '100%', overflowY: 'auto', animation: 'drawerIn .28s cubic-bezier(.22,1,.36,1)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${t.DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {loading ? (
              <div style={{ width: 140, height: 20, borderRadius: 6, background: t.BG_BTN }} />
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ color: t.TEXT_MAIN, fontSize: 18, fontWeight: 700, margin: 0 }}>{role?.name}</h3>
                  {role?.isSystem && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: t.SYS_BG, color: t.SYS_CLR, fontWeight: 700, letterSpacing: '.5px' }}>SYSTÈME</span>
                  )}
                </div>
                <code style={{ fontSize: 11.5, color: ORANGE, background: 'rgba(239,159,39,.1)', padding: '2px 8px', borderRadius: 6 }}>{role?.code}</code>
                {role?.description && <p style={{ color: t.TEXT_MUTED, fontSize: 13, margin: '8px 0 0', lineHeight: 1.6 }}>{role.description}</p>}
              </>
            )}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>

        {/* Stats */}
        {!loading && role && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '1rem 1.5rem', borderBottom: `1px solid ${t.DIVIDER}` }}>
            {[
              { label: 'Permissions', value: permCount, icon: '🔐' },
              { label: 'Utilisateurs', value: userCount, icon: '👥' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: t.BG_CARD, border: `1px solid ${t.BORDER}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: t.TEXT_MAIN, margin: '4px 0 2px' }}>{value}</div>
                <div style={{ fontSize: 11, color: t.TEXT_DIM }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${t.DIVIDER}`, padding: '0 1.5rem' }}>
          {(['permissions', 'users'] as const).map(k => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '12px 0', marginRight: 20, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: 'none', border: 'none', cursor: 'pointer', color: tab === k ? ORANGE : t.TEXT_DIM, borderBottom: `2px solid ${tab === k ? ORANGE : 'transparent'}`, transition: 'all .15s' }}>
              {k === 'permissions' ? 'Permissions' : 'Utilisateurs'}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
          {loading ? (
            <Spinner track={t.SPIN_TRACK} />
          ) : tab === 'permissions' ? (
            <PermissionsTab role={role!} t={t} />
          ) : (
            <UsersTab role={role!} t={t} />
          )}
        </div>

        {/* Actions */}
        {!loading && role && !role.isSystem && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(role)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Modifier
            </button>
            <button onClick={() => onDelete(role)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(226,75,74,.22)', background: 'rgba(226,75,74,.07)', color: '#e24b4a', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PermissionsTab({ role, t }: { role: RoleDetail; t: ReturnType<typeof useTokens> }) {
  if (!role.rolePermissions.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: t.TEXT_DIM }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
        <p style={{ fontSize: 13, margin: 0 }}>Aucune permission configurée</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {role.rolePermissions.map(p => {
        const active = PERM_KEYS.filter(k => p[k as keyof RolePermission] === true)
        const isFullAccess = p.specialPermission === 'FULL_ACCESS'
        return (
          <div key={p.id} style={{ padding: '12px 14px', borderRadius: 12, background: t.BG_PERM, border: `1px solid ${t.BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.TEXT_MAIN }}>{p.resource.name}</span>
                <code style={{ marginLeft: 8, fontSize: 10, color: t.TEXT_DIM, background: t.BG_BTN, padding: '1px 6px', borderRadius: 4 }}>{p.resource.code}</code>
              </div>
              {isFullAccess && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(239,159,39,.12)', color: ORANGE, fontWeight: 700 }}>FULL ACCESS</span>
              )}
            </div>
            {!isFullAccess && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {PERM_KEYS.map(k => (
                  <span key={k} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: active.includes(k) ? 'rgba(29,158,117,.12)' : t.BG_BTN, color: active.includes(k) ? '#1D9E75' : t.TEXT_DIM, border: `1px solid ${active.includes(k) ? 'rgba(29,158,117,.2)' : t.BORDER}` }}>
                    {active.includes(k) ? '✓ ' : ''}{PERM_LABELS[k]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function UsersTab({ role, t }: { role: RoleDetail; t: ReturnType<typeof useTokens> }) {
  if (!role.userRoles.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: t.TEXT_DIM }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
        <p style={{ fontSize: 13, margin: 0 }}>Aucun utilisateur assigné</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {role.userRoles.map(({ user, assignedAt }) => (
        <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: t.BG_PERM, border: `1px solid ${t.BORDER}` }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {initials(user)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.TEXT_MAIN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName(user)}</div>
            <div style={{ fontSize: 11.5, color: t.TEXT_DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <div style={{ fontSize: 11, color: t.TEXT_DIM, flexShrink: 0 }}>{fmtDate(assignedAt)}</div>
        </div>
      ))}
      {role._count.userRoles > role.userRoles.length && (
        <p style={{ textAlign: 'center', fontSize: 12, color: t.TEXT_DIM, margin: '4px 0 0' }}>
          + {role._count.userRoles - role.userRoles.length} autre(s) utilisateur(s)
        </p>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function RolesPage() {
  const t = useTokens()

  const [roles,       setRoles]       = useState<Role[]>([])
  const [pagination,  setPagination]  = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading,     setLoading]     = useState(true)

  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(20)
  const [sortBy,  setSortBy]  = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null)
  const [drawerRoleId,setDrawerRoleId]= useState<string | null>(null)
  const [editRole,    setEditRole]    = useState<Role | null | 'new'>('new' as any)
  const [showModal,   setShowModal]   = useState(false)
  const [confirm,     setConfirm]     = useState<{ title?: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void } | null>(null)

  // init editRole to null (not 'new')
  useEffect(() => { setEditRole(null) }, [])

  // ── Charger rôles ─────────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit), sortBy, sortDir,
        ...(search && { search }),
      })
      const res = await api.get(`/api/roles?${p}`)
      setRoles(res.data.data)
      setPagination(res.data.pagination)
      setSelected(new Set())
    } catch { showToast('Erreur lors du chargement', 'err') }
    setLoading(false)
  }, [page, limit, search, sortBy, sortDir])

  useEffect(() => { fetchRoles() }, [fetchRoles])
  useEffect(() => { setPage(1) }, [search, limit, sortBy, sortDir])

  function showToast(msg: string, type: 'ok' | 'err' | 'warn' = 'ok') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000)
  }

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

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll    = () => setSelected(s => s.size === roles.length ? new Set() : new Set(roles.map(r => r.id)))
  const allSelected  = roles.length > 0 && selected.size === roles.length
  const someSelected = selected.size > 0

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async function handleSave(data: { name: string; code: string; description: string }) {
    try {
      if (editRole && typeof editRole === 'object') {
        await api.patch(`/api/roles/${editRole.id}`, data)
        showToast('Rôle mis à jour')
      } else {
        await api.post('/api/roles', data)
        showToast('Rôle créé')
      }
      setShowModal(false); setEditRole(null)
      fetchRoles()
      if (drawerRoleId) setDrawerRoleId(null)
    } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur', 'err') }
  }

  function handleDelete(role: Role) {
    setConfirm({
      title:        'Supprimer le rôle',
      message:      `Supprimer le rôle "${role.name}" ? Cette action est irréversible. Les utilisateurs assignés perdront ce rôle.`,
      danger:       true,
      confirmLabel: 'Supprimer',
      onConfirm:    async () => {
        setConfirm(null)
        try {
          await api.delete(`/api/roles/${role.id}`)
          showToast(`Rôle "${role.name}" supprimé`)
          fetchRoles()
          if (drawerRoleId === role.id) setDrawerRoleId(null)
        } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur', 'err') }
      },
    })
  }

  async function handleBulkDelete() {
    const ids = [...selected].filter(id => !roles.find(r => r.id === id)?.isSystem)
    if (!ids.length) { showToast('Aucun rôle supprimable sélectionné', 'warn'); return }
    setConfirm({
      title:        `Supprimer ${ids.length} rôle(s)`,
      message:      `Supprimer définitivement ${ids.length} rôle(s) ? Les rôles système sont ignorés.`,
      danger:       true,
      confirmLabel: 'Tout supprimer',
      onConfirm:    async () => {
        setConfirm(null)
        try {
          const results = await Promise.allSettled(ids.map(id => api.delete(`/api/roles/${id}`)))
          const ok  = results.filter(r => r.status === 'fulfilled').length
          const err = results.filter(r => r.status === 'rejected').length
          if (err) showToast(`${ok} supprimé(s), ${err} erreur(s)`, 'warn')
          else     showToast(`${ok} rôle(s) supprimé(s)`)
          fetchRoles()
        } catch { showToast('Erreur lors de la suppression', 'err') }
      },
    })
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: t.BG_CARD, border: `1px solid ${t.BORDER}`, borderRadius: 18, overflow: 'hidden' }
  const inp:  React.CSSProperties = { padding: '9px 13px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT, color: t.TEXT_MAIN, fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const btn  = (bg = ORANGE, clr = '#fff', extra?: React.CSSProperties): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', background: bg, color: clr, display: 'flex', alignItems: 'center', gap: 6, ...extra })
  const th:   React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.TEXT_DIM, whiteSpace: 'nowrap', userSelect: 'none' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes toastIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn  { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .rrow:hover { background: ${t.ROW_HOVER} !important; }
        .rrow.sel   { background: ${t.ROW_SEL}   !important; }
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

        {toast    && <Toast {...toast} />}
        {confirm  && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
        {showModal && <RoleModal role={editRole as Role | null} onSave={handleSave} onClose={() => { setShowModal(false); setEditRole(null) }} />}
        {drawerRoleId && (
          <RoleDrawer
           key={drawerRoleId}
            roleId={drawerRoleId}
            onClose={() => setDrawerRoleId(null)}
            onEdit={r => { setEditRole(r); setShowModal(true); setDrawerRoleId(null) }}
            onDelete={r => { handleDelete(r); setDrawerRoleId(null) }}
          />
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.03em', color: t.TEXT_MAIN }}>Rôles</h1>
            <p style={{ color: t.HEADER_SUB, fontSize: 13, margin: '4px 0 0', fontWeight: 300 }}>
              {loading ? '…' : `${pagination.total} rôle${pagination.total !== 1 ? 's' : ''} au total`}
            </p>
          </div>
          <button onClick={() => { setEditRole(null); setShowModal(true) }} style={{ ...btn(), boxShadow: `0 4px 14px rgba(239,159,39,.3)` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau rôle
          </button>
        </div>

        {/* ── Filtres ── */}
        <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Recherche */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.TEXT_DIM, pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ ...inp, paddingLeft: 36, width: '100%' }} placeholder="Rechercher nom, code, description…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

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

            {search && (
              <button onClick={() => setSearch('')} style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}` }}>
                Réinitialiser ×
              </button>
            )}
          </div>

          {/* Actions groupées */}
          {someSelected && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button onClick={handleBulkDelete} style={{ ...btn('rgba(226,75,74,.1)', '#e24b4a'), border: '1px solid rgba(226,75,74,.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Supprimer
              </button>
              <button onClick={() => setSelected(new Set())} style={{ ...btn('none', t.TEXT_MUTED), marginLeft: 'auto' }}>Désélectionner</button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div style={card}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <Spinner track={t.SPIN_TRACK} />
              <p style={{ marginTop: 14, fontSize: 13 }}>Chargement…</p>
            </div>
          ) : roles.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ display: 'block', margin: '0 auto 14px', opacity: .3 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p style={{ fontSize: 14, margin: 0 }}>Aucun rôle trouvé</p>
              {search && <button onClick={() => setSearch('')} style={{ marginTop: 12, ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}`, margin: '12px auto 0' }}>Réinitialiser</button>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.BORDER}` }}>
                    <th style={{ ...th, width: 44, paddingRight: 0 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('name')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Nom <SortIcon field="name" /></span>
                    </th>
                    <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('code')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Code <SortIcon field="code" /></span>
                    </th>
                    <th style={th}>Description</th>
                    <th style={th}>Permissions</th>
                    <th style={th}>Utilisateurs</th>
                    <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('createdAt')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Créé le <SortIcon field="createdAt" /></span>
                    </th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => {
                    const isSel = selected.has(role.id)
                    return (
                      <tr key={role.id} className={`rrow${isSel ? ' sel' : ''}`} style={{ borderBottom: `1px solid ${t.DIVIDER}`, transition: 'background .13s', cursor: 'pointer' }}>
                        <td style={{ padding: '13px 8px 13px 14px' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(role.id)} />
                        </td>

                        {/* Nom */}
                        <td style={{ padding: '13px 14px' }} onClick={() => setDrawerRoleId(role.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: t.TEXT_MAIN, whiteSpace: 'nowrap' }}>{role.name}</div>
                              {role.isSystem && (
                                <span style={{ fontSize: 9, color: t.SYS_CLR, fontWeight: 700, letterSpacing: '.5px', background: t.SYS_BG, padding: '1px 6px', borderRadius: 4 }}>SYSTÈME</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td style={{ padding: '13px 14px' }} onClick={() => setDrawerRoleId(role.id)}>
                          <code style={{ fontSize: 12, color: ORANGE, background: 'rgba(239,159,39,.1)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{role.code}</code>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '13px 14px', fontSize: 13, color: t.TEXT_MUTED, maxWidth: 220 }} onClick={() => setDrawerRoleId(role.id)}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {role.description ?? <span style={{ color: t.TEXT_DIM }}>—</span>}
                          </div>
                        </td>

                        {/* Permissions */}
                        <td style={{ padding: '13px 14px' }} onClick={() => setDrawerRoleId(role.id)}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: role.rolePermissions.length ? t.TEXT_MAIN : t.TEXT_DIM }}>
                            {role.rolePermissions.length > 0 ? `${role.rolePermissions.length} ressource${role.rolePermissions.length > 1 ? 's' : ''}` : '—'}
                          </span>
                        </td>

                        {/* Utilisateurs */}
                        <td style={{ padding: '13px 14px' }} onClick={() => setDrawerRoleId(role.id)}>
                          <span style={{ fontSize: 12.5, padding: '3px 10px', borderRadius: 20, background: role._count.userRoles > 0 ? 'rgba(29,158,117,.1)' : t.BG_BTN, color: role._count.userRoles > 0 ? '#1D9E75' : t.TEXT_DIM, fontWeight: 600, border: `1px solid ${role._count.userRoles > 0 ? 'rgba(29,158,117,.2)' : t.BORDER}` }}>
                            {role._count.userRoles}
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDrawerRoleId(role.id)}>
                          {fmtDate(role.createdAt)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 14px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <button className="abtn" onClick={() => setDrawerRoleId(role.id)} title="Voir les détails"
                              style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            {!role.isSystem && (
                              <>
                                <button className="abtn" onClick={() => { setEditRole(role); setShowModal(true) }} title="Modifier"
                                  style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button className="abtn" onClick={() => handleDelete(role)} title="Supprimer"
                                  style={{ ...btn('rgba(226,75,74,.08)', '#e24b4a'), border: '1px solid rgba(226,75,74,.2)', padding: '6px 9px' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
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
                <button disabled={page <= 1} onClick={() => setPage(1)}
                  style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '7px 10px' }}>«</button>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page <= 1 ? 'not-allowed' : 'pointer', padding: '7px 11px' }}>‹</button>
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
                  style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', padding: '7px 11px' }}>›</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)}
                  style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', padding: '7px 10px' }}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}