'use client'
// src/app/admin/roles/_components/PermissionMatrix.tsx
// Éditeur de matrice de permissions (module × action) pour un rôle donné.
// Affiche TOUTES les ressources actives — même celles sans permission encore
// créée — et upsert via l'endpoint bulk au premier toggle. Réutilisé dans le
// drawer de la page Rôles.

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/app/lib/axios'

type Tokens = {
  BG_CARD: string; BG_MODAL: string; BG_INPUT: string; BG_BTN: string
  BORDER: string; BORDER_INP: string
  TEXT_MAIN: string; TEXT_MUTED: string; TEXT_DIM: string
  DIVIDER: string
}

type Resource = {
  id: string
  name: string
  code: string
  category: string | null
}

type ActionKey =
  | 'canList' | 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'
  | 'canExport' | 'canImport' | 'canPrint' | 'canDownload' | 'canUpload'
  | 'canValidate' | 'canCancel' | 'canApprove' | 'canArchive' | 'canRestore'
  | 'canManage' | 'canExecute'

type RolePermission = { id: string; specialPermission: 'NONE' | 'FULL_ACCESS'; resource: Resource } & Record<ActionKey, boolean>

const ORANGE = '#EF9F27'

const ACTION_GROUPS: { label: string; color: string; actions: { key: ActionKey; label: string; short: string }[] }[] = [
  {
    label: 'CRUD', color: '#4fa3e0',
    actions: [
      { key: 'canList',   label: 'Lister',    short: 'List' },
      { key: 'canRead',   label: 'Voir',      short: 'Voir' },
      { key: 'canCreate', label: 'Créer',     short: 'Créer' },
      { key: 'canUpdate', label: 'Modifier',  short: 'Modif.' },
      { key: 'canDelete', label: 'Supprimer', short: 'Suppr.' },
    ],
  },
  {
    label: 'Fichiers', color: '#1D9E75',
    actions: [
      { key: 'canExport',   label: 'Exporter',    short: 'Export' },
      { key: 'canImport',   label: 'Importer',    short: 'Import' },
      { key: 'canPrint',    label: 'Imprimer',    short: 'Print' },
      { key: 'canDownload', label: 'Télécharger', short: 'DL' },
      { key: 'canUpload',   label: 'Téléverser',  short: 'UL' },
    ],
  },
  {
    label: 'Workflow', color: '#a970e0',
    actions: [
      { key: 'canValidate', label: 'Valider',   short: 'Valid.' },
      { key: 'canCancel',   label: 'Annuler',   short: 'Annul.' },
      { key: 'canApprove',  label: 'Approuver', short: 'Appr.' },
      { key: 'canArchive',  label: 'Archiver',  short: 'Arch.' },
      { key: 'canRestore',  label: 'Restaurer', short: 'Rest.' },
    ],
  },
  {
    label: 'Avancées', color: ORANGE,
    actions: [
      { key: 'canManage',  label: 'Gérer',    short: 'Gérer' },
      { key: 'canExecute', label: 'Exécuter', short: 'Exéc.' },
    ],
  },
]
const ALL_ACTIONS = ACTION_GROUPS.flatMap(g => g.actions.map(a => a.key))

type Row = { resource: Resource; permissionId: string | null } & Record<ActionKey, boolean> & { specialPermission: 'NONE' | 'FULL_ACCESS' }

function emptyRow(resource: Resource): Row {
  const base = Object.fromEntries(ALL_ACTIONS.map(k => [k, false])) as Record<ActionKey, boolean>
  return { resource, permissionId: null, specialPermission: 'NONE', ...base }
}

export default function PermissionMatrix({ roleId, tokens: t }: { roleId: string; tokens: Tokens }) {
  const [resources, setResources]   = useState<Resource[]>([])
  const [rows, setRows]             = useState<Record<string, Row>>({})
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set())
  const [error, setError]           = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [resResources, resPerms] = await Promise.all([
        api.get('/api/permission-resources', { params: { limit: 200 } }),
        api.get(`/api/roles/${roleId}/permissions`),
      ])
      const list: Resource[] = resResources.data.data ?? []
      const perms: RolePermission[] = resPerms.data.data ?? []

      const nextRows: Record<string, Row> = {}
      for (const r of list) nextRows[r.id] = emptyRow(r)
      for (const p of perms) {
        if (!nextRows[p.resource.id]) nextRows[p.resource.id] = emptyRow(p.resource)
        const row = nextRows[p.resource.id]
        row.permissionId = p.id
        row.specialPermission = p.specialPermission
        for (const key of ALL_ACTIONS) row[key] = p[key]
      }

      setResources(list)
      setRows(nextRows)
    } catch {
      setError('Impossible de charger la matrice de permissions')
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => { load() }, [load])

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = resources.filter(r =>
      !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    )
    const byCategory = new Map<string, Resource[]>()
    for (const r of filtered) {
      const cat = r.category ?? 'Autres'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(r)
    }
    return Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [resources, search])

  function toggleCollapsed(cat: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // ── Écriture (upsert via l'endpoint bulk) ────────────────────────────────────
  async function persist(items: { resourceId: string; patch: Partial<Row> }[]) {
    setSaving(true)
    // Optimistic update
    setRows(prev => {
      const next = { ...prev }
      for (const { resourceId, patch } of items) {
        next[resourceId] = { ...next[resourceId], ...patch } as Row
      }
      return next
    })
    try {
      const payload = {
        items: items.map(({ resourceId, patch }) => {
          const row = { ...rows[resourceId], ...patch }
          const body: Record<string, unknown> = { resourceId, specialPermission: row.specialPermission }
          for (const key of ALL_ACTIONS) body[key] = row[key]
          return body
        }),
      }
      const res = await api.put(`/api/roles/${roleId}/permissions/bulk`, payload)
      setRows(prev => {
        const next = { ...prev }
        for (const updated of res.data.data) {
          const resourceId = updated.resource.id
          next[resourceId] = {
            resource: updated.resource,
            permissionId: updated.id,
            specialPermission: updated.specialPermission,
            ...Object.fromEntries(ALL_ACTIONS.map(k => [k, updated[k]])),
          } as Row
        }
        return next
      })
    } catch {
      setError('Erreur lors de l\'enregistrement — rechargement…')
      load()
    } finally {
      setSaving(false)
    }
  }

  function toggleCell(resourceId: string, key: ActionKey) {
    const row = rows[resourceId]
    if (!row || row.specialPermission === 'FULL_ACCESS') return
    persist([{ resourceId, patch: { [key]: !row[key] } as Partial<Row> }])
  }

  function toggleFullAccess(resourceId: string) {
    const row = rows[resourceId]
    if (!row) return
    persist([{ resourceId, patch: { specialPermission: row.specialPermission === 'FULL_ACCESS' ? 'NONE' : 'FULL_ACCESS' } }])
  }

  function toggleRowAll(resourceId: string) {
    const row = rows[resourceId]
    if (!row) return
    const allChecked = ALL_ACTIONS.every(k => row[k])
    const patch = Object.fromEntries(ALL_ACTIONS.map(k => [k, !allChecked])) as Partial<Row>
    persist([{ resourceId, patch }])
  }

  function toggleGlobalAll(check: boolean) {
    const items = resources.map(r => ({
      resourceId: r.id,
      patch: Object.fromEntries(ALL_ACTIONS.map(k => [k, check])) as Partial<Row>,
    }))
    persist(items)
  }

  const cellCheckbox = (checked: boolean, disabled: boolean, onChange: () => void) => (
    <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange}
      style={{ width: 15, height: 15, cursor: disabled ? 'not-allowed' : 'pointer', accentColor: ORANGE }} />
  )

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: t.TEXT_DIM, fontSize: 13 }}>Chargement de la matrice…</div>
  }

  return (
    <div>
      {error && <p style={{ color: '#e24b4a', fontSize: 12, margin: '0 0 10px' }}>⚠ {error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un module…"
          style={{ flex: '1 1 160px', padding: '7px 11px', borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT, color: t.TEXT_MAIN, fontSize: 12.5, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={() => toggleGlobalAll(true)} disabled={saving}
          style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 600 }}>
          Tout sélectionner
        </button>
        <button onClick={() => toggleGlobalAll(false)} disabled={saving}
          style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MAIN, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 11.5, fontWeight: 600 }}>
          Tout désélectionner
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {ACTION_GROUPS.map(g => (
          <span key={g.label} style={{ fontSize: 10.5, fontWeight: 700, color: g.color, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
            {g.label}
          </span>
        ))}
      </div>

      <div style={{ overflowX: 'auto', border: `1px solid ${t.BORDER}`, borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: t.BG_MODAL, padding: '8px 10px', textAlign: 'left', borderBottom: `1px solid ${t.BORDER}`, minWidth: 170 }}>Module</th>
              {ACTION_GROUPS.map(g => g.actions.map(a => (
                <th key={a.key} title={a.label} style={{ padding: '8px 6px', borderBottom: `1px solid ${t.BORDER}`, borderLeft: `2px solid ${g.color}22`, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: g.color, whiteSpace: 'nowrap', minWidth: 44 }}>
                  {a.short}
                </th>
              )))}
              <th style={{ padding: '8px 8px', borderBottom: `1px solid ${t.BORDER}`, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: t.TEXT_DIM }}>FULL</th>
              <th style={{ padding: '8px 8px', borderBottom: `1px solid ${t.BORDER}`, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: t.TEXT_DIM }}>Tout</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([category, resInCategory]) => (
              <>
                <tr key={`cat-${category}`}>
                  <td colSpan={ALL_ACTIONS.length + 3} onClick={() => toggleCollapsed(category)}
                    style={{ padding: '7px 10px', background: t.BG_CARD, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.TEXT_MUTED, borderBottom: `1px solid ${t.BORDER}` }}>
                    {collapsed.has(category) ? '▸' : '▾'} {category} ({resInCategory.length})
                  </td>
                </tr>
                {!collapsed.has(category) && resInCategory.map(resource => {
                  const row = rows[resource.id]
                  if (!row) return null
                  const fullAccess = row.specialPermission === 'FULL_ACCESS'
                  const allChecked = ALL_ACTIONS.every(k => row[k])
                  return (
                    <tr key={resource.id} style={{ borderBottom: `1px solid ${t.DIVIDER}` }}>
                      <td style={{ position: 'sticky', left: 0, background: t.BG_MODAL, padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: t.TEXT_MAIN }}>{resource.name}</div>
                        <code style={{ fontSize: 9.5, color: t.TEXT_DIM }}>{resource.code}</code>
                      </td>
                      {ACTION_GROUPS.map(g => g.actions.map(a => (
                        <td key={a.key} style={{ textAlign: 'center', padding: '4px 6px' }}>
                          {cellCheckbox(fullAccess ? true : row[a.key], saving || fullAccess, () => toggleCell(resource.id, a.key))}
                        </td>
                      )))}
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                        {cellCheckbox(fullAccess, saving, () => toggleFullAccess(resource.id))}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px 6px' }}>
                        {cellCheckbox(fullAccess || allChecked, saving || fullAccess, () => toggleRowAll(resource.id))}
                      </td>
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
