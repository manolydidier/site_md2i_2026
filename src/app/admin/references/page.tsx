'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/app/lib/axios'
import { mergeExcelSettings } from '@/app/lib/referenceExcelSettings'

import {
  CATEGORIES,
  cloneDefaultExcelSettings,
  LIMIT_OPTIONS,
  ORANGE,
  ORANGE_DARK,
  SORT_LABELS,
  STATUS_CFG,
  VISIBLE_COLS_DEFAULT,
} from './_components/constants'

import { ColsDropdown } from './_components/ColsDropdown'
import { ExcelSettingsModal } from './_components/ExcelSettingsModal'
import { OfferPreviewModal } from './_components/OfferPreviewModal'
import { ReferenceDrawer } from './_components/ReferenceDrawer'
import { ConfirmModal, Spinner, Toast, useTokens } from './_components/ui'

import type {
  ExcelExportSettings,
  ExportKind,
  OfferPreviewReference,
  Pagination,
  Reference,
  SortDir,
  SortField,
  VisibleColumns,
} from './_components/types'

function fmtDate(d: string | null, withTime = false) {
  if (!d) return '—'

  const dt = new Date(d)

  return withTime
    ? dt.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : dt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

function getFlagUrl(code: string) {
  return `https://flagicons.lipis.dev/flags/4x3/${code.toLowerCase()}.svg`
}

function slugText(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'offre'
  )
}

export default function ReferencesPage() {
  const t = useTokens()

  const [references, setReferences] = useState<Reference[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<ExportKind | null>(null)

  const [offerPrompt, setOfferPrompt] = useState('création de logiciel')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewRefs, setPreviewRefs] = useState<OfferPreviewReference[]>([])
  const [previewSelected, setPreviewSelected] = useState<Set<string>>(new Set())
  const [previewDomains, setPreviewDomains] = useState<string[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [excelSettingsOpen, setExcelSettingsOpen] = useState(false)
  const [excelSettings, setExcelSettings] = useState<ExcelExportSettings>(cloneDefaultExcelSettings())
  const [settingsHydrated, setSettingsHydrated] = useState(false)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cols, setCols] = useState<VisibleColumns>(VISIBLE_COLS_DEFAULT)
  const [showColsPicker, setShowColsPicker] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null)
  const [detailReference, setDetailReference] = useState<Reference | null>(null)
  const [confirm, setConfirm] = useState<{ title?: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('md2i_excel_export_settings')

    if (saved) {
      try {
        setExcelSettings(mergeExcelSettings(JSON.parse(saved)))
      } catch {
        localStorage.removeItem('md2i_excel_export_settings')
      }
    }

    setSettingsHydrated(true)
  }, [])

  useEffect(() => {
    if (!settingsHydrated) return
    localStorage.setItem('md2i_excel_export_settings', JSON.stringify(excelSettings))
  }, [excelSettings, settingsHydrated])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) {
        setShowColsPicker(false)
      }
    }

    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const fetchReferences = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
      })

      const res = await api.get(`/api/references?${params}`)
      setReferences(res.data.data)
      setPagination(res.data.pagination)
      setSelected(new Set())
    } catch {
      showToast('Erreur lors du chargement', 'err')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, status, category, sortBy, sortDir])

  useEffect(() => {
    fetchReferences()
  }, [fetchReferences])

  useEffect(() => {
    setPage(1)
  }, [search, status, category, limit, sortBy, sortDir])

  function showToast(msg: string, type: 'ok' | 'err' | 'warn' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) {
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.25 }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      )
    }

    return sortDir === 'asc' ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    )
  }

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const toggleAll = () =>
    setSelected((s) => (s.size === references.length ? new Set() : new Set(references.map((r) => r.id))))

  const allSelected = references.length > 0 && selected.size === references.length
  const someSelected = selected.size > 0

  async function performDelete(ids: string[]) {
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/references/${id}`)))
      showToast(ids.length > 1 ? `${ids.length} référence(s) supprimée(s)` : 'Référence supprimée')
      setDetailReference(null)
      fetchReferences()
    } catch {
      showToast('Erreur lors de la suppression', 'err')
    }
  }

  function handleDelete(ref: Reference) {
    setConfirm({
      title: 'Supprimer la référence',
      message: `Supprimer définitivement « ${ref.title} » ?`,
      danger: true,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        setConfirm(null)
        await performDelete([ref.id])
      },
    })
  }

  function handleBulkDelete() {
    const ids = [...selected]
    if (!ids.length) {
      showToast('Aucune référence sélectionnée', 'warn')
      return
    }

    setConfirm({
      title: `Supprimer ${ids.length} référence(s)`,
      message: `Supprimer définitivement ${ids.length} référence(s) sélectionnée(s) ?`,
      danger: true,
      confirmLabel: 'Tout supprimer',
      onConfirm: async () => {
        setConfirm(null)
        await performDelete(ids)
      },
    })
  }

  function getDownloadFilename(disposition: string | null, fallback: string) {
    if (!disposition) return fallback
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/)
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
    const plainMatch = disposition.match(/filename="?([^";]+)"?/)
    return plainMatch?.[1] || fallback
  }

  async function openOfferPreview() {
    const prompt = offerPrompt.trim()

    if (prompt.length < 2) {
      showToast('Écris un sujet d’offre, exemple : création de logiciel', 'warn')
      return
    }

    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewRefs([])
    setPreviewDomains([])
    setPreviewSelected(new Set())

    try {
      const response = await fetch('/api/references/export-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'preview', prompt, limit: 100 }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Analyse impossible')

      const refs = Array.isArray(payload.references) ? (payload.references as OfferPreviewReference[]) : []
      setPreviewRefs(refs)
      setPreviewDomains(Array.isArray(payload.detectedDomains) ? payload.detectedDomains : [])
      setPreviewSelected(new Set(refs.map((ref) => ref.id)))

      if (refs.length === 0) setPreviewError('Aucune référence liée à ce sujet.')
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Erreur pendant l’analyse')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function downloadOfferExport(kind: ExportKind, overrideIds?: string[]) {
    const ids = overrideIds ?? [...selected]
    const prompt = offerPrompt.trim()

    if (kind === 'selection' && ids.length === 0) {
      showToast('Coche au moins une référence pour exporter la sélection', 'warn')
      return
    }

    if (kind === 'prompt' && prompt.length < 2) {
      showToast('Écris un sujet d’offre, exemple : création de logiciel', 'warn')
      return
    }

    if (kind === 'prompt' && ids.length === 0) {
      showToast('Aucune référence sélectionnée dans l’aperçu', 'warn')
      return
    }

    setExporting(kind)

    try {
      const response = await fetch('/api/references/export-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'prompt'
            ? { mode: 'prompt', prompt, ids, limit: 200, settings: excelSettings }
            : { mode: 'selection', ids, settings: excelSettings },
        ),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Export impossible')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = getDownloadFilename(
        response.headers.get('content-disposition'),
        kind === 'prompt' ? `references-offre-${slugText(prompt)}.xlsx` : 'references-offre-selection.xlsx',
      )

      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      showToast('Export Excel généré')
      setPreviewOpen(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erreur pendant l export', 'err')
    } finally {
      setExporting(null)
    }
  }

  function togglePreviewReference(id: string) {
    setPreviewSelected((old) => {
      const next = new Set(old)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllPreview() {
    setPreviewSelected((old) =>
      old.size === previewRefs.length ? new Set() : new Set(previewRefs.map((ref) => ref.id)),
    )
  }

  const card: CSSProperties = { background: t.BG_CARD, border: `1px solid ${t.BORDER}`, borderRadius: 18, overflow: 'hidden' }
  const inp: CSSProperties = { padding: '9px 13px', borderRadius: 11, border: `1px solid ${t.BORDER_INP}`, background: t.BG_INPUT, color: t.TEXT_MAIN, fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const btn = (bg = ORANGE, clr = '#fff', extra?: CSSProperties): CSSProperties => ({ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', background: bg, color: clr, display: 'flex', alignItems: 'center', gap: 6, ...extra })
  const th: CSSProperties = { padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: t.TEXT_DIM, whiteSpace: 'nowrap', userSelect: 'none' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes toastIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes modalIn { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .rrow:hover { background: ${t.ROW_HOVER} !important; }
        .rrow.sel { background: ${t.ROW_SEL} !important; }
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
        {toast && <Toast {...toast} />}
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
        {detailReference && <ReferenceDrawer reference={detailReference} onClose={() => setDetailReference(null)} onDelete={() => handleDelete(detailReference)} />}

        <OfferPreviewModal open={previewOpen} prompt={offerPrompt} loading={previewLoading} error={previewError} references={previewRefs} domains={previewDomains} selectedIds={previewSelected} exporting={exporting === 'prompt'} onClose={() => setPreviewOpen(false)} onToggle={togglePreviewReference} onToggleAll={toggleAllPreview} onExport={() => downloadOfferExport('prompt', [...previewSelected])} />

        <ExcelSettingsModal open={excelSettingsOpen} settings={excelSettings} setSettings={setExcelSettings} onClose={() => setExcelSettingsOpen(false)} onSaved={() => showToast('Paramètres Excel enregistrés')} />

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.03em', color: t.TEXT_MAIN }}>Références MD2I</h1>
            <p style={{ color: t.HEADER_SUB, fontSize: 13, margin: '4px 0 0', fontWeight: 300 }}>{loading ? '…' : `${pagination.total} référence${pagination.total !== 1 ? 's' : ''} au total`}</p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input value={offerPrompt} onChange={(e) => setOfferPrompt(e.target.value)} placeholder="Ex : création de logiciel, SIG, paie, cloud..." style={{ ...inp, width: 310, maxWidth: '100%' }} />
              <button type="button" onClick={openOfferPreview} disabled={previewLoading || exporting !== null} style={{ ...btn('rgba(29,158,117,.12)', '#1D9E75'), border: '1px solid rgba(29,158,117,.28)', opacity: previewLoading || exporting ? 0.72 : 1 }}>{previewLoading ? 'Analyse...' : 'Analyser offre'}</button>
              <button type="button" onClick={() => setExcelSettingsOpen(true)} style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}` }}>Paramètres Excel</button>
            </div>

            <Link href="/admin/references/new" style={{ ...btn(`linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, '#fff'), textDecoration: 'none' }}>+ Nouvelle référence</Link>
          </div>
        </div>

        <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 180 }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.TEXT_DIM, pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input style={{ ...inp, paddingLeft: 36, width: '100%' }} placeholder="Rechercher titre, client, pays…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <select style={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>

            <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select style={inp} value={`${sortBy}:${sortDir}`} onChange={(e) => { const [f, d] = e.target.value.split(':'); setSortBy(f as SortField); setSortDir(d as SortDir) }}>
              {(Object.keys(SORT_LABELS) as SortField[]).flatMap((f) => [
                <option key={`${f}:asc`} value={`${f}:asc`}>{SORT_LABELS[f]} ↑</option>,
                <option key={`${f}:desc`} value={`${f}:desc`}>{SORT_LABELS[f]} ↓</option>,
              ])}
            </select>

            <select style={{ ...inp, minWidth: 80 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l} / page</option>)}
            </select>

            <div ref={colsRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowColsPicker((v) => !v)} style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}` }}>Colonnes</button>
              {showColsPicker && <ColsDropdown cols={cols} setCols={setCols} />}
            </div>

            {(search || status || category) && <button onClick={() => { setSearch(''); setStatus(''); setCategory('') }} style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}` }}>Réinitialiser ×</button>}
          </div>

          {someSelected && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button onClick={() => downloadOfferExport('selection')} disabled={exporting !== null} style={{ ...btn('rgba(29,158,117,.12)', '#1D9E75'), border: '1px solid rgba(29,158,117,.28)', opacity: exporting ? 0.72 : 1 }}>{exporting === 'selection' ? 'Export...' : 'Exporter sélection .xlsx'}</button>
              <button onClick={handleBulkDelete} style={{ ...btn('rgba(226,75,74,.1)', '#e24b4a'), border: '1px solid rgba(226,75,74,.25)' }}>Supprimer</button>
              <button onClick={() => setSelected(new Set())} style={{ ...btn('none', t.TEXT_MUTED), marginLeft: 'auto' }}>Désélectionner tout</button>
            </div>
          )}
        </div>

        <div style={card}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <Spinner spinTrack={t.SPIN_TRACK} />
              <p style={{ marginTop: 14, fontSize: 13 }}>Chargement…</p>
            </div>
          ) : references.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <p style={{ fontSize: 14, margin: 0 }}>Aucune référence trouvée</p>
              <Link href="/admin/references/new" style={{ ...btn(`linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, '#fff', { margin: '14px auto 0', width: 'fit-content' }), textDecoration: 'none' }}>Créer la première référence</Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.BORDER}` }}>
                    <th style={{ ...th, width: 44, paddingRight: 0 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                    {cols.image && <th style={th}></th>}
                    {cols.title && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('title')}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Titre <SortIcon field="title" /></span></th>}
                    {cols.client && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('client')}>Client</th>}
                    {cols.country && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('country')}>Pays</th>}
                    {cols.category && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('category')}>Catégorie</th>}
                    {cols.date && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('date')}>Année</th>}
                    {cols.status && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('status')}>Statut</th>}
                    {cols.createdAt && <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('createdAt')}>Création</th>}
                    {cols.actions && <th style={{ ...th, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {references.map((ref) => {
                    const sc = STATUS_CFG[ref.status]
                    const isSel = selected.has(ref.id)

                    return (
                      <tr key={ref.id} className={`rrow${isSel ? ' sel' : ''}`} style={{ borderBottom: `1px solid ${t.DIVIDER}` }}>
                        <td style={{ padding: '13px 8px 13px 14px' }} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleSelect(ref.id)} /></td>

                        {cols.image && (
                          <td style={{ padding: '13px 4px' }} onClick={() => setDetailReference(ref)}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: t.BG_INPUT, border: `1px solid ${t.BORDER}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {ref.image ? <Image src={ref.image} alt={ref.title} width={42} height={42} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, opacity: 0.55 }}>🌍</span>}
                            </div>
                          </td>
                        )}

                        {cols.title && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailReference(ref)}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: t.TEXT_MAIN, whiteSpace: 'nowrap' }}>{ref.title}</div>
                            <div style={{ fontSize: 11.5, color: t.TEXT_DIM }}>{ref.slug}</div>
                          </td>
                        )}

                        {cols.client && <td style={{ padding: '13px 14px', fontSize: 13, color: t.TEXT_MUTED, whiteSpace: 'nowrap' }} onClick={() => setDetailReference(ref)}>{ref.client}</td>}

                        {cols.country && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailReference(ref)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <img src={getFlagUrl(ref.code)} alt={ref.country} style={{ width: 24, height: 18, borderRadius: 3, objectFit: 'cover' }} />
                              <span style={{ fontSize: 13 }}>{ref.country}</span>
                            </div>
                          </td>
                        )}

                        {cols.category && <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_MUTED, whiteSpace: 'nowrap' }} onClick={() => setDetailReference(ref)}>{ref.category}</td>}
                        {cols.date && <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 600, color: ORANGE, whiteSpace: 'nowrap' }} onClick={() => setDetailReference(ref)}>{ref.date}</td>}

                        {cols.status && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailReference(ref)}>
                            <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                              {sc.label}
                            </span>
                          </td>
                        )}

                        {cols.createdAt && <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDetailReference(ref)}>{fmtDate(ref.createdAt)}</td>}

                        {cols.actions && (
                          <td style={{ padding: '13px 14px' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                              <button className="abtn" onClick={() => setDetailReference(ref)} title="Voir les détails" style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}>Voir</button>
                              <Link href={`/admin/references/${ref.id}`} className="abtn" title="Modifier" style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px', textDecoration: 'none' }}>Modifier</Link>
                              <button className="abtn" onClick={() => handleDelete(ref)} title="Supprimer" style={{ ...btn('rgba(226,75,74,.08)', '#e24b4a'), border: '1px solid rgba(226,75,74,.2)', padding: '6px 9px' }}>Suppr.</button>
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

          {!loading && pagination.totalPages > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: t.TEXT_DIM }}>Page {page} / {pagination.totalPages} — {pagination.total} résultat{pagination.total !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button disabled={page <= 1} onClick={() => setPage(1)} style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, padding: '7px 10px' }}>«</button>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, padding: '7px 11px' }}>‹</button>

                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, pagination.totalPages - 6))
                  const p = start + i
                  if (p > pagination.totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ ...btn(p === page ? ORANGE : t.BG_BTN, p === page ? '#fff' : t.TEXT_MAIN), border: `1.5px solid ${p === page ? 'transparent' : t.BORDER}`, minWidth: 34, padding: '7px 4px', justifyContent: 'center', fontWeight: p === page ? 700 : 500 }}>{p}</button>
                  )
                })}

                <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, padding: '7px 11px' }}>›</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)} style={{ ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN), border: `1px solid ${t.BORDER}`, padding: '7px 10px' }}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}