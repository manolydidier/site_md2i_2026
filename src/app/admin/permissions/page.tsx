'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

// ─── Types alignés sur le vrai schema ──────────────────────────────────────────

type PermissionResource = {
  id: string
  name: string
  code: string
  description?: string
}

type Role = {
  id: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  _count?: { rolePermissions: number; userRoles: number }
}

type RolePermission = {
  id: string
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canList: boolean
  canExport: boolean
  canApprove: boolean
  canManage: boolean
  specialPermission: 'NONE' | 'FULL_ACCESS'
  resource: PermissionResource
}

// ─── Config des colonnes d'actions ─────────────────────────────────────────────

const ACTION_COLS: { key: keyof RolePermission; label: string; short: string }[] = [
  { key: 'canList',    label: 'Lister',    short: 'LIST'  },
  { key: 'canRead',    label: 'Lire',      short: 'READ'  },
  { key: 'canCreate',  label: 'Créer',     short: 'POST'  },
  { key: 'canUpdate',  label: 'Modifier',  short: 'PATCH' },
  { key: 'canDelete',  label: 'Supprimer', short: 'DEL'   },
  { key: 'canExport',  label: 'Exporter',  short: 'EXP'   },
  { key: 'canApprove', label: 'Approuver', short: 'APR'   },
  { key: 'canManage',  label: 'Gérer',     short: 'MGT'   },
]

type FormState = {
  resourceId: string
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canList: boolean
  canExport: boolean
  canApprove: boolean
  canManage: boolean
  specialPermission: 'NONE' | 'FULL_ACCESS'
}

const EMPTY_FORM = (): FormState => ({
  resourceId: '',
  canRead: false, canCreate: false, canUpdate: false, canDelete: false,
  canList: false, canExport: false, canApprove: false, canManage: false,
  specialPermission: 'NONE',
})

// ─── Composant Toggle ──────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, opacity: disabled ? 0.4 : 1,
        background: checked ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)',
        color: checked ? '#16a34a' : '#94a3b8',
        transition: 'all .15s',
      }}
    >
      {checked ? '✓' : '·'}
    </button>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { dark } = useTheme()

  // Data
  const [roles, setRoles]                 = useState<Role[]>([])
  const [selectedRole, setSelectedRole]   = useState<Role | null>(null)
  const [permissions, setPermissions]     = useState<RolePermission[]>([])
  const [resources, setResources]         = useState<PermissionResource[]>([])

  // UI state
  const [loading, setLoading]             = useState(false)
  const [saving, setSaving]               = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM())
  const [formError, setFormError]         = useState<string | null>(null)
  const [formLoading, setFormLoading]     = useState(false)

  // Tokens CSS adaptatifs
  const c = {
    bg:       dark ? '#0f172a' : '#f8fafc',
    surface:  dark ? '#1e293b' : '#ffffff',
    surface2: dark ? '#0f172a' : '#f1f5f9',
    border:   dark ? '#334155' : '#e2e8f0',
    text:     dark ? '#f1f5f9' : '#0f172a',
    muted:    dark ? '#94a3b8' : '#64748b',
    accent:   '#6366f1',
  }

  // ── Chargement initial ───────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      api.get('/api/roles'),
      api.get('/api/permission-resources'),
    ])
      .then(([rolesRes, resourcesRes]) => {
        setRoles(rolesRes.data.data ?? [])
        setResources(resourcesRes.data.data ?? [])
        
        
      })
      .catch(() => setError('Impossible de charger les données initiales.'))
  }, [])

  // ── Chargement des permissions quand le rôle change ──────────────────────────

  const loadPermissions = useCallback(async (role: Role) => {
    setLoading(true)
    setError(null)
    setPermissions([])
    setShowForm(false)
    setForm(EMPTY_FORM())
    try {
      const res = await api.get(`/api/roles/${role.id}/permissions`)
      setPermissions(res.data.data ?? [])
      console.log(res, role.id, );
      
    } catch {
      setError('Impossible de charger les permissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRoleSelect = (roleId: string) => {
    const role = roles.find(r => r.id === roleId) ?? null
    setSelectedRole(role)
    if (role) loadPermissions(role)
    else setPermissions([])
  }

  // ── Toggle d'un flag booléen (optimistic update) ─────────────────────────────

  const handleToggle = async (perm: RolePermission, key: keyof RolePermission) => {
    if (!selectedRole) return
    const patched = { ...perm, [key]: !perm[key] }

    // Optimistic : on met à jour l'UI immédiatement
    setPermissions(prev => prev.map(p => p.id === perm.id ? patched : p))
    setSaving(perm.id)

    try {
      await api.patch(
        `/api/roles/${selectedRole.id}/permissions/${perm.id}`,
        { [key]: patched[key] }   // mise à jour partielle — seul le champ changé
      )
    } catch {
      // Rollback si erreur
      setPermissions(prev => prev.map(p => p.id === perm.id ? perm : p))
      setError('Erreur lors de la mise à jour.')
    } finally {
      setSaving(null)
    }
  }

  // ── Changement de specialPermission ──────────────────────────────────────────

  const handleSpecial = async (perm: RolePermission, value: 'NONE' | 'FULL_ACCESS') => {
    if (!selectedRole) return
    const patched = { ...perm, specialPermission: value }
    setPermissions(prev => prev.map(p => p.id === perm.id ? patched : p))
    setSaving(perm.id)
    try {
      await api.patch(
        `/api/roles/${selectedRole.id}/permissions/${perm.id}`,
        { specialPermission: value }
      )
    } catch {
      setPermissions(prev => prev.map(p => p.id === perm.id ? perm : p))
      setError('Erreur lors de la mise à jour.')
    } finally {
      setSaving(null) }
  }

  // ── Suppression ───────────────────────────────────────────────────────────────

  const handleDelete = async (perm: RolePermission) => {
    if (!selectedRole) return
    if (!confirm(`Supprimer la permission sur "${perm.resource.name}" ?`)) return
    try {
      await api.delete(`/api/roles/${selectedRole.id}/permissions/${perm.id}`)
      setPermissions(prev => prev.filter(p => p.id !== perm.id))
    } catch {
      setError('Erreur lors de la suppression.')
    }
  }

  // ── Création d'une nouvelle permission ────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedRole) return
    setFormError(null)
    if (!form.resourceId) { setFormError('Sélectionnez une ressource.'); return }

    setFormLoading(true)
    try {
      const res = await api.post(`/api/roles/${selectedRole.id}/permissions`, form)
      setPermissions(prev => [...prev, res.data])
      setShowForm(false)
      setForm(EMPTY_FORM())
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Erreur lors de la création.'
      setFormError(msg)
    } finally {
      setFormLoading(false)
    }
  }

  // ── Ressources disponibles (pas encore assignées à ce rôle) ──────────────────

  const availableResources = resources.filter(
    r => !permissions.some(p => p.resource.id === r.id)
  )

  // ── Permissions spéciales (FULL_ACCESS) ──────────────────────────────────────

  const specialPerms = permissions.filter(p => p.specialPermission === 'FULL_ACCESS')

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', background: c.bg, color: c.text,
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '28px 20px', maxWidth: 1200, margin: '0 auto',
    }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>
          Gestion des permissions
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: c.muted }}>
          Définissez les droits d'accès par rôle et par ressource.
        </p>
      </div>

      {/* ── Sélecteur de rôle ── */}
      <div style={{
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>
          Rôle
        </div>
        <select
          value={selectedRole?.id ?? ''}
          onChange={e => handleRoleSelect(e.target.value)}
          style={{
            flex: '1 1 200px', maxWidth: 300,
            padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.border}`,
            background: c.bg, color: c.text, fontSize: 14, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">— Sélectionner un rôle —</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}{r.isSystem ? ' (système)' : ''}
            </option>
          ))}
        </select>

        {selectedRole && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: `${c.accent}15`, color: c.accent, border: `1px solid ${c.accent}30`,
            }}>
              {selectedRole.name}
            </span>
            {selectedRole.isSystem && (
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)',
              }}>
                système
              </span>
            )}
            {selectedRole._count && (
              <span style={{ fontSize: 12, color: c.muted }}>
                {selectedRole._count.userRoles} utilisateur{selectedRole._count.userRoles !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Bannière d'erreur ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          color: '#ef4444', fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── État : aucun rôle sélectionné ── */}
      {!selectedRole && (
        <div style={{
          background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
          padding: '56px 24px', textAlign: 'center', color: c.muted,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            Sélectionnez un rôle pour voir et modifier ses permissions.
          </p>
        </div>
      )}

      {/* ── Chargement ── */}
      {selectedRole && loading && (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: c.muted }}>
          <p style={{ margin: 0, fontSize: 14 }}>Chargement…</p>
        </div>
      )}

      {/* ── Contenu principal ── */}
      {selectedRole && !loading && (
        <>
          {/* Barre d'actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 13, color: c.muted }}>
              <strong style={{ color: c.text }}>{permissions.length}</strong>{' '}
              ressource{permissions.length !== 1 ? 's' : ''} configurée{permissions.length !== 1 ? 's' : ''}
            </span>
            {availableResources.length > 0 && (
              <button
                onClick={() => { setShowForm(v => !v); setFormError(null) }}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: showForm ? c.border : c.accent,
                  color: showForm ? c.text : '#fff',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {showForm ? '✕ Annuler' : '+ Ajouter une permission'}
              </button>
            )}
          </div>

          {/* ── Formulaire d'ajout ── */}
          {showForm && (
            <div style={{
              background: c.surface, border: `1px solid ${c.accent}50`,
              borderRadius: 12, padding: '18px 20px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.accent, marginBottom: 14 }}>
                Nouvelle permission — {selectedRole.name}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                {/* Sélection de la ressource */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>
                    Ressource *
                  </label>
                  <select
                    value={form.resourceId}
                    onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}
                    style={{
                      padding: '7px 12px', borderRadius: 7, border: `1px solid ${c.border}`,
                      background: c.bg, color: c.text, fontSize: 13, minWidth: 180,
                    }}
                  >
                    <option value="">— Choisir —</option>
                    {availableResources.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Toggles des actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ACTION_COLS.map(({ key, label }) => (
                    <label key={key} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 600, color: c.muted, cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '.04em',
                    }}>
                      {label}
                      <Toggle
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                      />
                    </label>
                  ))}
                </div>

                {/* Permission spéciale */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>
                    Spéciale
                  </label>
                  <select
                    value={form.specialPermission}
                    onChange={e => setForm(f => ({ ...f, specialPermission: e.target.value as 'NONE' | 'FULL_ACCESS' }))}
                    style={{
                      padding: '7px 12px', borderRadius: 7, border: `1px solid ${c.border}`,
                      background: c.bg, color: c.text, fontSize: 13,
                    }}
                  >
                    <option value="NONE">Aucune</option>
                    <option value="FULL_ACCESS">Full Access</option>
                  </select>
                </div>

                {/* Bouton soumettre */}
                <button
                  onClick={handleCreate}
                  disabled={formLoading}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: formLoading ? 'not-allowed' : 'pointer',
                    background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13,
                    opacity: formLoading ? 0.6 : 1, alignSelf: 'flex-end',
                  }}
                >
                  {formLoading ? '…' : '✓ Créer'}
                </button>
              </div>

              {formError && (
                <p style={{ color: '#ef4444', fontSize: 12, margin: '10px 0 0' }}>⚠ {formError}</p>
              )}
            </div>
          )}

          {/* ── État vide ── */}
          {permissions.length === 0 && (
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
              padding: '48px 24px', textAlign: 'center', color: c.muted,
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <p style={{ margin: '0 0 16px', fontSize: 14 }}>
                Aucune permission configurée pour <strong>{selectedRole.name}</strong>.
              </p>
              {availableResources.length > 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: c.accent, color: '#fff', fontWeight: 600, fontSize: 13,
                  }}
                >
                  + Créer la première permission
                </button>
              )}
            </div>
          )}

          {/* ── Tableau des permissions ── */}
          {permissions.length > 0 && (
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 860 }}>
                  <thead>
                    <tr style={{ background: c.surface2 }}>
                      <th style={thStyle(c)}>Ressource</th>
                      {ACTION_COLS.map(col => (
                        <th key={col.key} style={{ ...thStyle(c), textAlign: 'center', minWidth: 54 }}>
                          <span title={col.label}>{col.short}</span>
                        </th>
                      ))}
                      <th style={{ ...thStyle(c), textAlign: 'center' }}>Spéciale</th>
                      <th style={{ ...thStyle(c), textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm, i) => {
                      const isSaving = saving === perm.id
                      const isFullAccess = perm.specialPermission === 'FULL_ACCESS'
                      return (
                        <tr
                          key={perm.id}
                          style={{
                            background: i % 2 === 0 ? c.surface : c.surface2,
                            opacity: isSaving ? 0.55 : 1,
                            transition: 'opacity .1s',
                          }}
                        >
                          {/* Nom de la ressource */}
                          <td style={{ padding: '10px 16px', borderBottom: `1px solid ${c.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                background: `${c.accent}15`, color: c.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 13,
                              }}>
                                {perm.resource.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{perm.resource.name}</div>
                                <div style={{ fontSize: 10, color: c.muted, fontFamily: 'monospace' }}>
                                  {perm.resource.code}
                                </div>
                              </div>
                              {isFullAccess && (
                                <span style={{
                                  padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                  background: 'rgba(234,179,8,0.12)', color: '#ca8a04',
                                  border: '1px solid rgba(234,179,8,0.25)',
                                }}>
                                  FULL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Toggles des actions */}
                          {ACTION_COLS.map(({ key }) => (
                            <td key={key} style={{ padding: '10px 6px', borderBottom: `1px solid ${c.border}`, textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Toggle
                                  checked={isFullAccess ? true : (perm[key] as boolean)}
                                  onChange={() => handleToggle(perm, key)}
                                  disabled={isSaving || isFullAccess}
                                />
                              </div>
                            </td>
                          ))}

                          {/* Permission spéciale */}
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, textAlign: 'center' }}>
                            <select
                              value={perm.specialPermission}
                              onChange={e => handleSpecial(perm, e.target.value as 'NONE' | 'FULL_ACCESS')}
                              disabled={isSaving}
                              style={{
                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                border: `1px solid ${isFullAccess ? 'rgba(234,179,8,0.4)' : c.border}`,
                                background: isFullAccess ? 'rgba(234,179,8,0.08)' : c.bg,
                                color: isFullAccess ? '#ca8a04' : c.muted,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                textTransform: 'uppercase', letterSpacing: '.04em',
                              }}
                            >
                              <option value="NONE">Aucune</option>
                              <option value="FULL_ACCESS">Full Access</option>
                            </select>
                          </td>

                          {/* Supprimer */}
                          <td style={{ padding: '10px 12px', borderBottom: `1px solid ${c.border}`, textAlign: 'center' }}>
                            <button
                              onClick={() => handleDelete(perm)}
                              disabled={isSaving}
                              style={{
                                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Section permissions spéciales (résumé en bas) ── */}
          {specialPerms.length > 0 && (
            <div style={{
              marginTop: 24,
              background: dark ? '#1c1400' : '#fffbeb',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#ca8a04',
                textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12,
              }}>
                ⚡ Permissions spéciales — {specialPerms.length} ressource{specialPerms.length > 1 ? 's' : ''} en Full Access
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {specialPerms.map(perm => (
                  <div
                    key={perm.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(234,179,8,0.08)',
                      border: '1px solid rgba(234,179,8,0.25)',
                      borderRadius: 10, padding: '8px 14px',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: 'rgba(234,179,8,0.15)', color: '#ca8a04',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12,
                    }}>
                      {perm.resource.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: dark ? '#fef08a' : '#92400e' }}>
                        {perm.resource.name}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#ca8a04' }}>
                        {perm.resource.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#ca8a04', opacity: 0.8 }}>
                Les ressources en Full Access ignorent les toggles individuels — toutes les actions sont autorisées.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Helper style en-tête tableau ───────────────────────────────────────────────

function thStyle(c: { border: string; muted: string }) {
  return {
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: 10,
    color: c.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '.07em',
    borderBottom: `1px solid ${c.border}`,
    whiteSpace: 'nowrap' as const,
  }
}