'use client'

import { useEffect, useState, useCallback } from 'react'

interface StageOption {
  id: string
  key: string
  label: string
  color: string
  sortOrder: number
  isDefault: boolean
  isActive: boolean
}

const ORANGE = '#EF9F27'

const EMPTY_FORM = { label: '', color: '#f97316', sortOrder: 0 }

interface StageManagerProps {
  canUpdate: boolean
}

export default function StageManager({ canUpdate }: StageManagerProps) {
  const [open, setOpen] = useState(false)
  const [stages, setStages] = useState<StageOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchStages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/crm/opportunity-stages?includeInactive=1')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement.')
      setStages(Array.isArray(json) ? json : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchStages()
  }, [open, fetchStages])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/crm/opportunity-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erreur pendant l'ajout.")
      setForm(EMPTY_FORM)
      fetchStages()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(stage: StageOption) {
    try {
      await fetch(`/api/crm/opportunity-stages/${stage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !stage.isActive }),
      })
      fetchStages()
    } catch (e) {
      console.error(e)
    }
  }

  if (!canUpdate) return null

  return (
    <div className="stage-manager">
      <button type="button" className="stage-manager__toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Fermer la gestion des étapes' : 'Gérer les étapes du pipeline'}
      </button>

      {open && (
        <div className="stage-manager__panel">
          {error && <p className="stage-manager__error">{error}</p>}

          {loading ? (
            <p className="stage-manager__empty">Chargement…</p>
          ) : (
            <ul className="stage-manager__list">
              {stages.map((stage) => (
                <li key={stage.id} className="stage-manager__item">
                  <span className="stage-manager__dot" style={{ background: stage.color }} />
                  <span className="stage-manager__label">{stage.label}</span>
                  <code className="stage-manager__key">{stage.key}</code>
                  <button
                    type="button"
                    className="stage-manager__toggle-btn"
                    onClick={() => toggleActive(stage)}
                  >
                    {stage.isActive ? 'Désactiver' : 'Réactiver'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreate} className="stage-manager__form">
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Nouvelle étape (ex : Relance)"
              className="stage-manager__input"
            />
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              className="stage-manager__color"
            />
            <button type="submit" disabled={saving} className="stage-manager__add">
              {saving ? 'Ajout…' : '+ Ajouter'}
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .stage-manager { margin-bottom: 16px; }
        .stage-manager__toggle {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(239,159,39,0.28);
          background: rgba(239,159,39,0.08);
          color: ${ORANGE};
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .stage-manager__panel {
          margin-top: 10px;
          padding: 16px;
          border-radius: 16px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
        }
        .stage-manager__error { color: #ef4444; font-size: 12px; margin: 0 0 10px; }
        .stage-manager__empty { color: #6B7280; font-size: 12px; margin: 0; }
        .stage-manager__list { list-style: none; margin: 0 0 14px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .stage-manager__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #F8FAFC;
        }
        .stage-manager__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .stage-manager__label { font-size: 13px; font-weight: 600; color: #111827; flex: 1; }
        .stage-manager__key { font-size: 11px; color: #94A3B8; }
        .stage-manager__toggle-btn {
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: #374151;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        .stage-manager__form { display: flex; gap: 8px; }
        .stage-manager__input {
          flex: 1;
          min-height: 38px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          font-size: 13px;
        }
        .stage-manager__color { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #E5E7EB; padding: 2px; }
        .stage-manager__add {
          padding: 0 16px;
          border-radius: 10px;
          border: none;
          background: ${ORANGE};
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
