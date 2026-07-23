'use client'
// app/admin/permissions/page.tsx
// Catalogue des modules/tables de l'application (PermissionResource). Ajouter
// un module ici le rend immédiatement disponible dans la matrice de
// permissions de chaque rôle (page /admin/roles) — sans aucune modification
// de code. C'est ce qui rend le système évolutif.

import { useState, useEffect, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

function apiErrorMessage(e: unknown, fallback: string) {
  if (isAxiosError(e) && typeof e.response?.data?.error === 'string') return e.response.data.error
  return fallback
}

type Resource = {
  id: string
  name: string
  code: string
  category: string | null
  description: string | null
  isActive: boolean
  _count: { rolePermissions: number }
}

const ORANGE      = '#EF9F27'
const ORANGE_DARK = '#c97d15'

function useTokens() {
  const { dark } = useTheme()
  return {
    dark,
    BG_CARD:    dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)',
    BG_MODAL:   dark ? '#111116'               : '#ffffff',
    BG_INPUT:   dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    BG_BTN:     dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    BORDER:     dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    BORDER_INP: dark ? 'rgba(255,255,255,.1)'  : 'rgba(0,0,0,.12)',
    BORDER_MOD: dark ? 'rgba(255,255,255,.1)'  : 'rgba(0,0,0,.1)',
    TEXT_MAIN:  dark ? '#f0ede8'               : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.45)',
    TEXT_DIM:   dark ? 'rgba(255,255,255,.26)' : 'rgba(0,0,0,.3)',
    DIVIDER:    dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)',
    CANCEL_CLR: dark ? 'rgba(255,255,255,.5)'  : 'rgba(0,0,0,.45)',
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  Contenu:        '#4fa3e0',
  Catalogue:      '#1D9E75',
  CRM:            '#a970e0',
  Marketing:      '#e05ba0',
  Administration: ORANGE,
}
function categoryColor(cat: string | null) {
  return (cat && CATEGORY_COLORS[cat]) || '#8a8a8a'
}

function slugifyCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}

type FormState = { name: string; code: string; category: string; description: string; isActive: boolean }
const EMPTY_FORM = (): FormState => ({ name: '', code: '', category: '', description: '', isActive: true })

function ResourceModal({ resource, onSave, onClose }: {
  resource: Resource | null
  onSave: (data: FormState) => Promise<void>
  onClose: () => void
}) {
  const t = useTokens()
  const [form, setForm] = useState<FormState>(
    resource
      ? { name: resource.name, code: resource.code, category: resource.category ?? '', description: resource.description ?? '', isActive: resource.isActive }
      : EMPTY_FORM()
  )
  const [codeEdited, setCodeEdited] = useState(!!resource)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!resource && !codeEdited) {
      setForm(f => ({ ...f, code: slugifyCode(f.name) }))
    }
  }, [form.name, resource, codeEdited])

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    if (!form.code.trim()) { setError('Le code est requis'); return }
    setError(null)
    setSaving(true)
    try {
      await onSave(form)
    } catch (e: unknown) {
      setError(apiErrorMessage(e, 'Erreur lors de l\'enregistrement'))
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT,
    color: t.TEXT_MAIN, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '1.3px',
    textTransform: 'uppercase', color: t.TEXT_DIM, marginBottom: 6,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 22, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 32px 64px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: t.TEXT_MAIN, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {resource ? 'Modifier le module' : 'Nouveau module'}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nom</label>
            <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Devis" />
          </div>
          <div>
            <label style={lbl}>Code</label>
            <input style={{ ...inp, fontFamily: 'monospace' }} value={form.code}
              onChange={e => { setCodeEdited(true); setForm(f => ({ ...f, code: slugifyCode(e.target.value) })) }}
              placeholder="ex: devis" />
            <p style={{ color: t.TEXT_DIM, fontSize: 11, margin: '4px 0 0' }}>Doit correspondre au segment d&apos;URL de l&apos;API (ex. /api/devis → devis)</p>
          </div>
          <div>
            <label style={lbl}>Catégorie</label>
            <input style={inp} list="category-options" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ex: Catalogue" />
            <datalist id="category-options">
              {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label style={lbl}>Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span></label>
            <textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.TEXT_MAIN, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Module actif
          </label>
        </div>

        {error && <p style={{ color: '#e24b4a', fontSize: 12.5, margin: '12px 0 0' }}>⚠ {error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.CANCEL_CLR, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: saving ? .7 : 1 }}>
            {saving ? 'Enregistrement…' : resource ? 'Enregistrer' : 'Créer le module'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PermissionsCatalogPage() {
  const t = useTokens()

  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editing, setEditing]     = useState<Resource | null | 'new'>(null)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/permission-resources', {
        params: { limit: 200, includeInactive: showInactive ? 'true' : undefined, search: search || undefined },
      })
      setResources(res.data.data ?? [])
    } catch {
      showToast('Impossible de charger les modules', 'err')
    } finally {
      setLoading(false)
    }
  }, [search, showInactive])

  useEffect(() => { fetchResources() }, [fetchResources])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSave(data: FormState) {
    if (editing && typeof editing === 'object') {
      await api.patch(`/api/permission-resources/${editing.id}`, data)
      showToast('Module mis à jour')
    } else {
      await api.post('/api/permission-resources', data)
      showToast('Module créé — disponible immédiatement dans la matrice des rôles')
    }
    setEditing(null)
    fetchResources()
  }

  async function handleToggleActive(r: Resource) {
    try {
      await api.patch(`/api/permission-resources/${r.id}`, { isActive: !r.isActive })
      showToast(r.isActive ? 'Module désactivé' : 'Module réactivé')
      fetchResources()
    } catch {
      showToast('Erreur lors de la mise à jour', 'err')
    }
  }

  async function handleDelete(r: Resource) {
    if (!confirm(`Supprimer définitivement le module "${r.name}" ?`)) return
    try {
      await api.delete(`/api/permission-resources/${r.id}`)
      showToast('Module supprimé')
      fetchResources()
    } catch (e: unknown) {
      if (isAxiosError(e) && e.response?.status === 409) {
        showToast('Utilisé par des rôles — désactivez-le plutôt que de le supprimer', 'err')
      } else {
        showToast('Erreur lors de la suppression', 'err')
      }
    }
  }

  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean))) as string[]
  const filtered = categoryFilter ? resources.filter(r => r.category === categoryFilter) : resources

  const card: React.CSSProperties = { background: t.BG_CARD, border: `1px solid ${t.BORDER}`, borderRadius: 18, overflow: 'hidden' }
  const inp:  React.CSSProperties = { padding: '9px 13px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT, color: t.TEXT_MAIN, fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const th:   React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.TEXT_DIM, whiteSpace: 'nowrap' }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: t.TEXT_MAIN }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, background: toast.type === 'ok' ? 'rgba(29,158,117,.95)' : 'rgba(226,75,74,.95)', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.35)' }}>
          {toast.type === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}
      {editing && (
        <ResourceModal resource={editing === 'new' ? null : editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.03em' }}>Modules &amp; ressources</h1>
          <p style={{ color: t.TEXT_MUTED, fontSize: 13, margin: '4px 0 0', fontWeight: 300 }}>
            {loading ? '…' : `${resources.length} module${resources.length !== 1 ? 's' : ''}`} — le catalogue des tables disponibles pour les permissions de rôle
          </p>
        </div>
        <button onClick={() => setEditing('new')} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: ORANGE, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,159,39,.3)' }}>
          + Nouveau module
        </button>
      </div>

      <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input style={{ ...inp, flex: '1 1 220px', minWidth: 180 }} placeholder="Rechercher un module…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={inp} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.TEXT_MUTED, cursor: 'pointer' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Afficher les modules désactivés
        </label>
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: t.TEXT_DIM, fontSize: 13 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: t.TEXT_DIM, fontSize: 13 }}>Aucun module trouvé</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.BORDER}` }}>
                  <th style={th}>Module</th>
                  <th style={th}>Catégorie</th>
                  <th style={th}>Description</th>
                  <th style={th}>Rôles</th>
                  <th style={th}>Statut</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${t.DIVIDER}`, opacity: r.isActive ? 1 : .55 }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                      <code style={{ fontSize: 10.5, color: ORANGE, background: 'rgba(239,159,39,.1)', padding: '1px 6px', borderRadius: 4 }}>{r.code}</code>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.category && (
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: `${categoryColor(r.category)}18`, color: categoryColor(r.category), border: `1px solid ${categoryColor(r.category)}30` }}>
                          {r.category}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: t.TEXT_MUTED, maxWidth: 260 }}>
                      {r.description ?? <span style={{ color: t.TEXT_DIM }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: t.TEXT_MUTED }}>{r._count.rolePermissions}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: r.isActive ? 'rgba(29,158,117,.1)' : 'rgba(148,148,148,.12)', color: r.isActive ? '#1D9E75' : t.TEXT_DIM }}>
                        {r.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditing(r)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: 'pointer', fontSize: 12 }}>Modifier</button>
                        <button onClick={() => handleToggleActive(r)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: 'pointer', fontSize: 12 }}>
                          {r.isActive ? 'Désactiver' : 'Réactiver'}
                        </button>
                        <button onClick={() => handleDelete(r)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(226,75,74,.2)', background: 'rgba(226,75,74,.08)', color: '#e24b4a', cursor: 'pointer', fontSize: 12 }}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
