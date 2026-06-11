'use client'

import { ORANGE } from './constants'
import type { OfferPreviewReference } from './types'
import { Spinner, useTokens } from './ui'

export function OfferPreviewModal({ open, prompt, loading, error, references, domains, selectedIds, exporting, onClose, onToggle, onToggleAll, onExport }: { open: boolean; prompt: string; loading: boolean; error: string | null; references: OfferPreviewReference[]; domains: string[]; selectedIds: Set<string>; exporting: boolean; onClose: () => void; onToggle: (id: string) => void; onToggleAll: () => void; onExport: () => void }) {
  const t = useTokens()

  if (!open) return null

  const btn = (bg = ORANGE, clr = '#fff', extra?: React.CSSProperties): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', background: bg, color: clr, display: 'flex', alignItems: 'center', gap: 6, ...extra })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.68)', backdropFilter: 'blur(7px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 'min(980px, 96vw)', maxHeight: '88vh', background: t.BG_MODAL, border: `1px solid ${t.BORDER_MOD}`, borderRadius: 22, boxShadow: '0 32px 80px rgba(0,0,0,.45)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'modalIn .22s ease' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${t.DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          <div>
            <h3 style={{ margin: 0, color: t.TEXT_MAIN, fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>Aperçu de l’offre</h3>
            <p style={{ margin: '5px 0 0', color: t.TEXT_MUTED, fontSize: 13, lineHeight: 1.5 }}>Sujet : <strong style={{ color: ORANGE }}>{prompt}</strong></p>
            {domains.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {domains.map((domain) => <span key={domain} style={{ padding: '4px 9px', borderRadius: 999, background: 'rgba(239,159,39,.12)', color: ORANGE, fontSize: 11.5, fontWeight: 600 }}>{domain}</span>)}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.BORDER_INP}`, background: t.BG_BTN, color: t.TEXT_MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${t.DIVIDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: t.TEXT_MUTED, fontSize: 13 }}>{loading ? 'Analyse des références…' : `${references.length} référence(s) trouvée(s) — ${selectedIds.size} sélectionnée(s)`}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={onToggleAll} disabled={loading || references.length === 0} style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}`, opacity: loading || references.length === 0 ? 0.5 : 1 }}>{selectedIds.size === references.length ? 'Tout décocher' : 'Tout cocher'}</button>
              <button onClick={onExport} disabled={loading || exporting || selectedIds.size === 0} style={{ ...btn('rgba(29,158,117,.12)', '#1D9E75'), border: '1px solid rgba(29,158,117,.28)', opacity: loading || exporting || selectedIds.size === 0 ? 0.55 : 1 }}>{exporting ? 'Export...' : 'Exporter .xlsx'}</button>
            </div>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <Spinner spinTrack={t.SPIN_TRACK} />
              <p style={{ marginTop: 14, fontSize: 13 }}>Recherche intelligente en cours…</p>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', borderRadius: 16, border: '1px solid rgba(226,75,74,.25)', background: 'rgba(226,75,74,.06)', color: '#e24b4a', fontSize: 14 }}>{error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {references.map((ref) => {
                const checked = selectedIds.has(ref.id)
                return (
                  <div key={ref.id} style={{ border: `1px solid ${checked ? 'rgba(239,159,39,.35)' : t.BORDER}`, background: checked ? t.ROW_SEL : t.BG_CARD, borderRadius: 16, padding: '13px 14px', display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, alignItems: 'start' }}>
                    <input type="checkbox" checked={checked} onChange={() => onToggle(ref.id)} style={{ marginTop: 3 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: t.TEXT_MAIN, fontSize: 14.5 }}>{ref.title}</strong>
                        <span style={{ color: t.TEXT_DIM, fontSize: 12 }}>{ref.client} · {ref.country} · {ref.date}</span>
                      </div>
                      <div style={{ color: t.TEXT_MUTED, fontSize: 12.5, marginTop: 4 }}>{ref.category}</div>
                      {ref.excerpt && <p style={{ color: t.TEXT_MUTED, fontSize: 13, lineHeight: 1.55, margin: '8px 0 0' }}>{ref.excerpt}</p>}
                      {ref.matchedTerms.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                          {ref.matchedTerms.slice(0, 12).map((term) => <span key={term} style={{ padding: '3px 7px', borderRadius: 999, background: t.BG_BTN, color: t.TEXT_MUTED, fontSize: 11 }}>{term}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 78, textAlign: 'center', padding: '7px 9px', borderRadius: 12, background: ref.relevance >= 70 ? 'rgba(29,158,117,.12)' : ref.relevance >= 45 ? 'rgba(245,166,35,.12)' : 'rgba(124,135,153,.12)', color: ref.relevance >= 70 ? '#1D9E75' : ref.relevance >= 45 ? '#f5a623' : '#7c8799', fontWeight: 800, fontSize: 13 }}>{ref.relevance}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}