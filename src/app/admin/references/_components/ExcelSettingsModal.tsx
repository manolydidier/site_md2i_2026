'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import {
  ALL_REFERENCE_EXCEL_COLUMNS,
  EXCEL_EXPORT_PRESETS,
  applyExcelPreset,
  cloneDefaultExcelSettings,
} from '@/app/lib/referenceExcelSettings'
import { ORANGE, ORANGE_DARK } from './constants'
import type {
  ExcelExportSettings,
  ReferenceExcelColumnKey,
  ReferenceExcelColumnSetting,
} from './types'
import { useTokens } from './ui'

type SettingsTab = 'presets' | 'appearance' | 'columns'

export function ExcelSettingsModal({
  open,
  settings,
  setSettings,
  onClose,
  onSaved,
}: {
  open: boolean
  settings: ExcelExportSettings
  setSettings: Dispatch<SetStateAction<ExcelExportSettings>>
  onClose: () => void
  onSaved: () => void
}) {
  const t = useTokens()
  const [activeTab, setActiveTab] = useState<SettingsTab>('presets')
  const [columnSearch, setColumnSearch] = useState('')

  const selectedColumns = settings.columns.filter((col) => col.enabled)
  const selectedCount = selectedColumns.length

  const filteredColumns = useMemo(() => {
    const q = columnSearch.trim().toLowerCase()

    if (!q) return settings.columns

    return settings.columns.filter((column) => {
      return (
        column.key.toLowerCase().includes(q) ||
        column.label.toLowerCase().includes(q)
      )
    })
  }, [settings.columns, columnSearch])

  if (!open) return null

  const inp: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_INPUT,
    color: t.TEXT_MAIN,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  }

  const label: CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: t.TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
  }

  const btn = (
    bg = ORANGE,
    clr = '#fff',
    extra?: CSSProperties,
  ): CSSProperties => ({
    padding: '9px 14px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 800,
    fontFamily: 'inherit',
    background: bg,
    color: clr,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    transition: 'transform .15s ease, opacity .15s ease, border-color .15s ease',
    ...extra,
  })

  const softBtn = (active = false): CSSProperties => ({
    ...btn(active ? `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})` : t.BG_BTN, active ? '#fff' : t.TEXT_MUTED),
    border: `1px solid ${active ? 'transparent' : t.BORDER}`,
    boxShadow: active ? '0 10px 24px rgba(239,159,39,.22)' : 'none',
  })

  const panel: CSSProperties = {
    border: `1px solid ${t.BORDER}`,
    borderRadius: 20,
    background: t.BG_CARD,
    overflow: 'hidden',
  }

  const sectionTitle: CSSProperties = {
    margin: 0,
    color: t.TEXT_MAIN,
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: '-.02em',
  }

  const sectionSub: CSSProperties = {
    margin: '5px 0 0',
    color: t.TEXT_MUTED,
    fontSize: 12.5,
    lineHeight: 1.5,
  }

  function updateColumn<K extends keyof ReferenceExcelColumnSetting>(
    key: ReferenceExcelColumnKey,
    field: K,
    value: ReferenceExcelColumnSetting[K],
  ) {
    setSettings((old) => ({
      ...old,
      columns: old.columns.map((col) =>
        col.key === key ? { ...col, [field]: value } : col,
      ),
    }))
  }

  function moveColumn(key: ReferenceExcelColumnKey, direction: 'up' | 'down') {
    setSettings((old) => {
      const columns = old.columns.map((col) => ({ ...col }))
      const index = columns.findIndex((col) => col.key === key)

      if (index === -1) return old

      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= columns.length) return old

      const current = columns[index]
      columns[index] = columns[targetIndex]
      columns[targetIndex] = current

      return {
        ...old,
        columns,
      }
    })
  }

  function selectAllColumns() {
    setSettings((old) => ({
      ...old,
      columns: old.columns.map((col) => ({
        ...col,
        enabled: true,
      })),
    }))
  }

  function unselectAllColumns() {
    setSettings((old) => ({
      ...old,
      columns: old.columns.map((col) => ({
        ...col,
        enabled: false,
      })),
    }))
  }

  function resetColumnsOnly() {
    setSettings((old) => ({
      ...old,
      columns: ALL_REFERENCE_EXCEL_COLUMNS.map((col) => ({ ...col })),
    }))
  }

  function applyPreset(presetKey: Parameters<typeof applyExcelPreset>[0]) {
    setSettings((old) => applyExcelPreset(presetKey, old))
  }

  function saveSettings() {
    localStorage.setItem('md2i_excel_export_settings', JSON.stringify(settings))
    onClose()
    onSaved()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 520,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 'min(1240px, 98vw)',
          height: 'min(880px, 92vh)',
          background: t.BG_MODAL,
          border: `1px solid ${t.BORDER_MOD}`,
          borderRadius: 28,
          boxShadow: '0 38px 110px rgba(0,0,0,.55)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          animation: 'modalIn .22s ease',
        }}
      >
        <header
          style={{
            padding: '1.35rem 1.6rem',
            borderBottom: `1px solid ${t.DIVIDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            background: `linear-gradient(135deg, ${t.BG_MODAL}, ${t.BG_CARD})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                boxShadow: '0 14px 32px rgba(239,159,39,.28)',
                flexShrink: 0,
              }}
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M4 4h16v16H4z" />
                <path d="M4 9h16" />
                <path d="M9 4v16" />
                <path d="M14 4v16" />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  color: t.TEXT_MAIN,
                  fontSize: 20,
                  fontWeight: 950,
                  letterSpacing: '-.035em',
                }}
              >
                Studio d’export Excel
              </h3>

              <p
                style={{
                  margin: '5px 0 0',
                  color: t.TEXT_MUTED,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                Configure le modèle, l’apparence et les colonnes du fichier `.xlsx`.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                padding: '8px 11px',
                borderRadius: 999,
                background: 'rgba(239,159,39,.12)',
                color: ORANGE,
                fontSize: 12,
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              {selectedCount} colonne{selectedCount > 1 ? 's' : ''}
            </span>

            <button
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                border: `1px solid ${t.BORDER_INP}`,
                background: t.BG_BTN,
                color: t.TEXT_MUTED,
                cursor: 'pointer',
                fontSize: 21,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </header>

        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            minHeight: 0,
          }}
        >
          <aside
            style={{
              borderRight: `1px solid ${t.DIVIDER}`,
              padding: '1.1rem',
              background: t.BG_CARD,
              overflowY: 'auto',
            }}
          >
            <nav style={{ display: 'grid', gap: 8 }}>
              {[
                {
                  id: 'presets' as SettingsTab,
                  title: 'Modèles',
                  desc: 'Choisir un format',
                  icon: '✦',
                },
                {
                  id: 'appearance' as SettingsTab,
                  title: 'Apparence',
                  desc: 'Couleurs et feuille',
                  icon: '◈',
                },
                {
                  id: 'columns' as SettingsTab,
                  title: 'Colonnes',
                  desc: 'Champs exportés',
                  icon: '☷',
                },
              ].map((item) => {
                const active = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: `1px solid ${
                        active ? 'rgba(239,159,39,.42)' : t.BORDER
                      }`,
                      background: active
                        ? 'rgba(239,159,39,.11)'
                        : 'transparent',
                      color: active ? ORANGE : t.TEXT_MAIN,
                      borderRadius: 16,
                      padding: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      gap: 11,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        background: active
                          ? `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`
                          : t.BG_BTN,
                        color: active ? '#fff' : t.TEXT_MUTED,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>

                    <span>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 13.5,
                          fontWeight: 900,
                        }}
                      >
                        {item.title}
                      </strong>

                      <small
                        style={{
                          display: 'block',
                          color: active ? ORANGE : t.TEXT_DIM,
                          fontSize: 11.5,
                          marginTop: 2,
                        }}
                      >
                        {item.desc}
                      </small>
                    </span>
                  </button>
                )
              })}
            </nav>

            <div
              style={{
                ...panel,
                marginTop: 16,
                padding: 14,
                background: t.BG_MODAL,
              }}
            >
              <div style={label}>Aperçu rapide</div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: `1px solid ${t.BORDER}`,
                }}
              >
                <div
                  style={{
                    height: 34,
                    background: settings.titleBgColor,
                    color: settings.titleTextColor,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {settings.referencesSheetName || 'Références'}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(
                      selectedColumns.length || 1,
                      3,
                    )}, 1fr)`,
                  }}
                >
                  {selectedColumns.slice(0, 3).map((column) => (
                    <div
                      key={column.key}
                      style={{
                        padding: '8px 7px',
                        background: settings.headerBgColor,
                        color: settings.headerTextColor,
                        borderRight: `1px solid ${t.BORDER}`,
                        fontSize: 9.5,
                        fontWeight: 900,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {column.label}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(
                      selectedColumns.length || 1,
                      3,
                    )}, 1fr)`,
                  }}
                >
                  {selectedColumns.slice(0, 3).map((column) => (
                    <div
                      key={column.key}
                      style={{
                        padding: '8px 7px',
                        background: column.bgColor,
                        color: column.textColor,
                        borderRight: `1px solid ${t.BORDER}`,
                        fontSize: 9.5,
                        fontWeight: column.bold ? 900 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Exemple
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: 'grid',
                  gap: 7,
                  fontSize: 12,
                  color: t.TEXT_MUTED,
                }}
              >
                <div>Orientation : {settings.orientation === 'landscape' ? 'Paysage' : 'Portrait'}</div>
                <div>Police : {settings.fontSize}px</div>
                <div>Hauteur ligne : {settings.rowHeight}</div>
              </div>
            </div>
          </aside>

          <section
            style={{
              minHeight: 0,
              overflowY: 'auto',
              padding: '1.25rem',
            }}
          >
            {activeTab === 'presets' && (
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <h4 style={sectionTitle}>Modèles professionnels</h4>
                  <p style={sectionSub}>
                    Applique rapidement une configuration complète selon le type d’export.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 14,
                  }}
                >
                  {EXCEL_EXPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.key)}
                      style={{
                        textAlign: 'left',
                        border: `1px solid ${t.BORDER}`,
                        background: `linear-gradient(145deg, ${t.BG_MODAL}, ${t.BG_CARD})`,
                        color: t.TEXT_MAIN,
                        borderRadius: 20,
                        padding: 16,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        minHeight: 150,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 18px 42px rgba(0,0,0,.08)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.borderColor = 'rgba(239,159,39,.45)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.borderColor = t.BORDER
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                            alignItems: 'center',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 15,
                              fontWeight: 950,
                              letterSpacing: '-.02em',
                            }}
                          >
                            {preset.name}
                          </strong>

                          <span
                            style={{
                              fontSize: 10.5,
                              padding: '4px 8px',
                              borderRadius: 999,
                              background: 'rgba(239,159,39,.12)',
                              color: ORANGE,
                              fontWeight: 900,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {preset.badge}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '9px 0 0',
                            fontSize: 12.5,
                            lineHeight: 1.55,
                            color: t.TEXT_MUTED,
                          }}
                        >
                          {preset.description}
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: t.TEXT_DIM,
                          fontSize: 11.5,
                        }}
                      >
                        <span>
                          {preset.settings.columns.length} colonne
                          {preset.settings.columns.length > 1 ? 's' : ''}
                        </span>

                        <span style={{ color: ORANGE, fontWeight: 900 }}>
                          Appliquer →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <h4 style={sectionTitle}>Apparence du fichier Excel</h4>
                  <p style={sectionSub}>
                    Configure les feuilles, les couleurs générales, la police et la hauteur des lignes.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 14,
                  }}
                >
                  <div style={{ ...panel, padding: 16 }}>
                    <h5 style={{ ...sectionTitle, fontSize: 14 }}>Feuilles</h5>

                    <div style={{ display: 'grid', gap: 13, marginTop: 14 }}>
                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={label}>Nom feuille résumé</span>
                        <input
                          value={settings.summarySheetName}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              summarySheetName: e.target.value,
                            }))
                          }
                          style={inp}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={label}>Nom feuille références</span>
                        <input
                          value={settings.referencesSheetName}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              referencesSheetName: e.target.value,
                            }))
                          }
                          style={inp}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={label}>Orientation</span>
                        <select
                          value={settings.orientation}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              orientation: e.target.value as
                                | 'landscape'
                                | 'portrait',
                            }))
                          }
                          style={inp}
                        >
                          <option value="landscape">Paysage</option>
                          <option value="portrait">Portrait</option>
                        </select>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          color: t.TEXT_MUTED,
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={settings.showSummarySheet}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              showSummarySheet: e.target.checked,
                            }))
                          }
                        />
                        Ajouter une feuille résumé
                      </label>
                    </div>
                  </div>

                  <div style={{ ...panel, padding: 16 }}>
                    <h5 style={{ ...sectionTitle, fontSize: 14 }}>Style global</h5>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      {[
                        ['titleBgColor', 'Fond titre'],
                        ['titleTextColor', 'Texte titre'],
                        ['headerBgColor', 'Fond en-tête'],
                        ['headerTextColor', 'Texte en-tête'],
                        ['borderColor', 'Bordures'],
                      ].map(([key, title]) => (
                        <label key={key} style={{ display: 'grid', gap: 7 }}>
                          <span style={label}>{title}</span>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '44px 1fr',
                              gap: 8,
                              alignItems: 'center',
                            }}
                          >
                            <input
                              type="color"
                              value={
                                settings[key as keyof ExcelExportSettings] as string
                              }
                              onChange={(e) =>
                                setSettings((old) => ({
                                  ...old,
                                  [key]: e.target.value,
                                }))
                              }
                              style={{
                                width: 44,
                                height: 40,
                                borderRadius: 12,
                                border: `1px solid ${t.BORDER_INP}`,
                                background: t.BG_INPUT,
                                cursor: 'pointer',
                              }}
                            />

                            <code
                              style={{
                                fontSize: 12,
                                color: t.TEXT_MUTED,
                                background: t.BG_INPUT,
                                border: `1px solid ${t.BORDER}`,
                                borderRadius: 12,
                                padding: '10px 9px',
                              }}
                            >
                              {settings[key as keyof ExcelExportSettings] as string}
                            </code>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...panel, padding: 16 }}>
                    <h5 style={{ ...sectionTitle, fontSize: 14 }}>Lisibilité</h5>

                    <div style={{ display: 'grid', gap: 13, marginTop: 14 }}>
                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={label}>Taille police</span>
                        <input
                          type="number"
                          min={8}
                          max={18}
                          value={settings.fontSize}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              fontSize: Number(e.target.value),
                            }))
                          }
                          style={inp}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={label}>Hauteur ligne</span>
                        <input
                          type="number"
                          min={35}
                          max={260}
                          value={settings.rowHeight}
                          onChange={(e) =>
                            setSettings((old) => ({
                              ...old,
                              rowHeight: Number(e.target.value),
                            }))
                          }
                          style={inp}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'columns' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <h4 style={sectionTitle}>Colonnes exportées</h4>
                    <p style={sectionSub}>
                      Coche les champs à inclure dans Excel et configure leur style individuel.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={selectAllColumns}
                      style={{
                        ...softBtn(false),
                        padding: '8px 11px',
                      }}
                    >
                      Tout sélectionner
                    </button>

                    <button
                      type="button"
                      onClick={unselectAllColumns}
                      style={{
                        ...softBtn(false),
                        padding: '8px 11px',
                      }}
                    >
                      Tout décocher
                    </button>

                    <button
                      type="button"
                      onClick={resetColumnsOnly}
                      style={{
                        ...softBtn(false),
                        padding: '8px 11px',
                      }}
                    >
                      Défaut
                    </button>
                  </div>
                </div>

                <div style={{ ...panel, padding: 14 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(220px, 1fr) auto',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          position: 'absolute',
                          left: 13,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: t.TEXT_DIM,
                        }}
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>

                      <input
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        placeholder="Rechercher une colonne..."
                        style={{
                          ...inp,
                          paddingLeft: 38,
                        }}
                      />
                    </div>

                    <span
                      style={{
                        color: t.TEXT_DIM,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {filteredColumns.length} / {settings.columns.length}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  {filteredColumns.map((column, index) => {
                    const realIndex = settings.columns.findIndex(
                      (item) => item.key === column.key,
                    )

                    return (
                      <div
                        key={column.key}
                        style={{
                          ...panel,
                          padding: 0,
                          borderColor: column.enabled
                            ? 'rgba(239,159,39,.35)'
                            : t.BORDER,
                          background: column.enabled
                            ? 'rgba(239,159,39,.045)'
                            : t.BG_CARD,
                        }}
                      >
                        <div
                          style={{
                            padding: 14,
                            display: 'grid',
                            gridTemplateColumns:
                              'auto auto minmax(180px, 1.1fr) minmax(220px, 1.4fr) repeat(6, auto)',
                            gap: 10,
                            alignItems: 'center',
                            overflowX: 'auto',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 4,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => moveColumn(column.key, 'up')}
                              disabled={realIndex === 0}
                              style={{
                                ...btn(t.BG_BTN, t.TEXT_MUTED),
                                border: `1px solid ${t.BORDER}`,
                                width: 30,
                                height: 30,
                                padding: 0,
                                opacity: realIndex === 0 ? 0.35 : 1,
                              }}
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              onClick={() => moveColumn(column.key, 'down')}
                              disabled={realIndex === settings.columns.length - 1}
                              style={{
                                ...btn(t.BG_BTN, t.TEXT_MUTED),
                                border: `1px solid ${t.BORDER}`,
                                width: 30,
                                height: 30,
                                padding: 0,
                                opacity:
                                  realIndex === settings.columns.length - 1
                                    ? 0.35
                                    : 1,
                              }}
                            >
                              ↓
                            </button>
                          </div>

                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              color: t.TEXT_MUTED,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={column.enabled}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'enabled',
                                  e.target.checked,
                                )
                              }
                            />
                            Export
                          </label>

                          <div>
                            <div style={label}>Champ</div>
                            <div
                              style={{
                                marginTop: 6,
                                color: t.TEXT_MAIN,
                                fontSize: 13,
                                fontWeight: 900,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {column.key}
                            </div>
                          </div>

                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={label}>Titre Excel</span>
                            <input
                              value={column.label}
                              onChange={(e) =>
                                updateColumn(column.key, 'label', e.target.value)
                              }
                              style={inp}
                            />
                          </label>

                          <label style={{ display: 'grid', gap: 6, width: 88 }}>
                            <span style={label}>Largeur</span>
                            <input
                              type="number"
                              min={8}
                              max={120}
                              value={column.width}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'width',
                                  Number(e.target.value),
                                )
                              }
                              style={inp}
                            />
                          </label>

                          <label style={{ display: 'grid', gap: 6, width: 112 }}>
                            <span style={label}>Aligner</span>
                            <select
                              value={column.align}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'align',
                                  e.target
                                    .value as ReferenceExcelColumnSetting['align'],
                                )
                              }
                              style={inp}
                            >
                              <option value="left">Gauche</option>
                              <option value="center">Centre</option>
                              <option value="right">Droite</option>
                            </select>
                          </label>

                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={label}>Fond</span>
                            <input
                              type="color"
                              value={column.bgColor}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'bgColor',
                                  e.target.value,
                                )
                              }
                              style={{
                                width: 42,
                                height: 38,
                                borderRadius: 12,
                                border: `1px solid ${t.BORDER_INP}`,
                                background: t.BG_INPUT,
                              }}
                            />
                          </label>

                          <label style={{ display: 'grid', gap: 6 }}>
                            <span style={label}>Texte</span>
                            <input
                              type="color"
                              value={column.textColor}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'textColor',
                                  e.target.value,
                                )
                              }
                              style={{
                                width: 42,
                                height: 38,
                                borderRadius: 12,
                                border: `1px solid ${t.BORDER_INP}`,
                                background: t.BG_INPUT,
                              }}
                            />
                          </label>

                          <label
                            style={{
                              display: 'grid',
                              gap: 6,
                              justifyItems: 'center',
                              color: t.TEXT_MUTED,
                            }}
                          >
                            <span style={label}>Gras</span>
                            <input
                              type="checkbox"
                              checked={column.bold}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'bold',
                                  e.target.checked,
                                )
                              }
                            />
                          </label>

                          <label
                            style={{
                              display: 'grid',
                              gap: 6,
                              justifyItems: 'center',
                              color: t.TEXT_MUTED,
                            }}
                          >
                            <span style={label}>Ligne</span>
                            <input
                              type="checkbox"
                              checked={column.wrapText}
                              onChange={(e) =>
                                updateColumn(
                                  column.key,
                                  'wrapText',
                                  e.target.checked,
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </main>

        <footer
          style={{
            padding: '1rem 1.5rem',
            borderTop: `1px solid ${t.DIVIDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: t.BG_MODAL,
          }}
        >
          <button
            onClick={() => setSettings(cloneDefaultExcelSettings())}
            style={{
              ...softBtn(false),
            }}
          >
            Réinitialiser tout
          </button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={onClose}
              style={{
                ...softBtn(false),
              }}
            >
              Annuler
            </button>

            <button
              onClick={saveSettings}
              style={{
                ...btn(
                  `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
                  '#fff',
                ),
                boxShadow: '0 14px 34px rgba(239,159,39,.28)',
              }}
            >
              Enregistrer le paramétrage
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}