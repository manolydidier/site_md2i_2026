'use client'

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/context/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface Category {
  id: string
  name: string
}

interface ProductFormData {
  name: string
  slug: string
  excerpt: string
  price: string
  coverImage: string
  status: ProductStatus
  categoryId: string
  gjsHtml: string
}

interface Props {
  productId?: string
  authorId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatPrice(price: string) {
  if (!price || isNaN(Number(price))) return '—'
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    maximumFractionDigits: 0,
  }).format(Number(price))
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useTokens() {
  const { dark } = useTheme()

  return {
    dark,
    BG_PAGE: dark ? '#0a0a0f' : '#f6f3ee',
    BG_CARD: dark ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.88)',
    BG_MODAL: dark ? '#111116' : '#ffffff',
    BG_INPUT: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.035)',
    BG_BTN: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    BG_STICKY: dark ? 'rgba(10,10,15,.82)' : 'rgba(246,243,238,.82)',
    BORDER: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    BORDER_INP: dark ? 'rgba(255,255,255,.11)' : 'rgba(0,0,0,.12)',
    TEXT_MAIN: dark ? '#f0ede8' : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.48)' : 'rgba(0,0,0,.48)',
    TEXT_DIM: dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.32)',
    TEXT_LABEL: dark ? 'rgba(255,255,255,.38)' : 'rgba(0,0,0,.42)',
    DIVIDER: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    SHADOW: dark ? '0 20px 60px rgba(0,0,0,.35)' : '0 20px 50px rgba(0,0,0,.08)',
    ORANGE: '#EF9F27',
    ORANGE_DARK: '#c97d15',
    GREEN: '#1D9E75',
    RED: '#e24b4a',
    BLUE: '#4fa3e0',
    GRAY: '#7c8799',
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' | 'warn' }) {
  const bg =
    type === 'ok'
      ? 'rgba(29,158,117,.95)'
      : type === 'warn'
      ? 'rgba(245,166,35,.95)'
      : 'rgba(226,75,74,.95)'

  const icon = type === 'ok' ? '✓' : type === 'warn' ? '⚠' : '✕'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 500,
        padding: '12px 18px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        background: bg,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'toastIn .22s ease',
        maxWidth: 380,
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {msg}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ dark }: { dark: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        border: `2.5px solid ${dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'}`,
        borderTopColor: '#EF9F27',
        borderRadius: '50%',
        animation: 'spin .65s linear infinite',
      }}
    />
  )
}

// ─── Status config ────────────────────────────────────────────────────────────
function statusStyle(status: ProductStatus, t: ReturnType<typeof useTokens>) {
  switch (status) {
    case 'PUBLISHED':
      return {
        label: 'Publié',
        color: t.GREEN,
        bg: 'rgba(29,158,117,.12)',
        border: 'rgba(29,158,117,.24)',
      }
    case 'ARCHIVED':
      return {
        label: 'Archivé',
        color: t.GRAY,
        bg: 'rgba(124,135,153,.14)',
        border: 'rgba(124,135,153,.22)',
      }
    default:
      return {
        label: 'Brouillon',
        color: t.ORANGE,
        bg: 'rgba(239,159,39,.12)',
        border: 'rgba(239,159,39,.24)',
      }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductForm({ productId, authorId }: Props) {
  const router = useRouter()
  const t = useTokens()
  const isEdit = Boolean(productId)

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    slug: '',
    excerpt: '',
    price: '',
    coverImage: '',
    status: 'DRAFT',
    categoryId: '',
    gjsHtml: '',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slugLocked, setSlugLocked] = useState(isEdit)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null)

  const currentStatus = useMemo(() => statusStyle(form.status, t), [form.status, t])

  function showToast(msg: string, type: 'ok' | 'err' | 'warn' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ─── Load categories ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/product-categories?limit=200')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
      .catch((err) => {
        console.error(err)
        showToast('Erreur lors du chargement des catégories', 'err')
      })
  }, [])

  // ─── Load product data in edit mode ──────────────────────────────────────
  useEffect(() => {
    if (!productId) return

    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((j) => {
        const p = j.data

        setForm({
          name: p.name ?? '',
          slug: p.slug ?? '',
          excerpt: p.excerpt ?? '',
          price: p.price != null ? String(p.price) : '',
          coverImage: p.coverImage ?? '',
          status: p.status ?? 'DRAFT',
          categoryId: p.categoryId ?? '',
          gjsHtml: p.gjsHtml ?? '',
        })
      })
      .catch((err) => {
        console.error(err)
        showToast('Erreur lors du chargement du produit', 'err')
      })
      .finally(() => setLoading(false))
  }, [productId])

  // ─── Auto slug ───────────────────────────────────────────────────────────
  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: slugLocked ? f.slug : slugify(name),
    }))
  }

  // ─── Validate ────────────────────────────────────────────────────────────
  function validate() {
    const e: Record<string, string> = {}

    if (!form.name.trim()) e.name = 'Le nom est requis'
    if (!form.slug.trim()) e.slug = 'Le slug est requis'
    if (form.price && isNaN(Number(form.price))) e.price = 'Prix invalide'
    if (form.coverImage && !/^https?:\/\//.test(form.coverImage)) e.coverImage = 'URL invalide'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) {
      showToast('Veuillez corriger les champs du formulaire', 'warn')
      return
    }

    setSaving(true)

    try {
      const body = {
        name: form.name,
        slug: form.slug,
        excerpt: form.excerpt || undefined,
        price: form.price ? Number(form.price) : null,
        coverImage: form.coverImage || null,
        status: form.status,
        categoryId: form.categoryId || null,
        gjsHtml: form.gjsHtml || undefined,
        ...(!isEdit && { authorId }),
      }

      const res = await fetch(isEdit ? `/api/products/${productId}` : '/api/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (data?.details?.fieldErrors) {
          const fe: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.details.fieldErrors as Record<string, string[]>)) {
            fe[k] = v[0]
          }
          setErrors(fe)
        }

        showToast(data?.error || 'Erreur lors de l’enregistrement', 'err')
        return
      }

      showToast(isEdit ? 'Produit mis à jour' : 'Produit créé avec succès', 'ok')

      setTimeout(() => {
        router.push('/admin/products')
        router.refresh()
      }, 500)
    } catch (err) {
      console.error(err)
      showToast('Erreur réseau ou serveur', 'err')
    } finally {
      setSaving(false)
    }
  }

  // ─── Shared styles ───────────────────────────────────────────────────────
  const card: CSSProperties = {
    background: t.BG_CARD,
    border: `1px solid ${t.BORDER}`,
    borderRadius: 20,
    boxShadow: t.SHADOW,
    overflow: 'hidden',
    backdropFilter: 'blur(14px)',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_INPUT,
    color: t.TEXT_MAIN,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color .18s, box-shadow .18s, background .18s',
  }

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: t.TEXT_LABEL,
    marginBottom: 8,
  }

  const sectionTitle: CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    color: t.TEXT_LABEL,
    margin: 0,
  }

  const btnSecondary: CSSProperties = {
    padding: '10px 16px',
    borderRadius: 11,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_BTN,
    color: t.TEXT_MAIN,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
  }

  const btnPrimary: CSSProperties = {
    padding: '10px 18px',
    borderRadius: 11,
    border: 'none',
    background: `linear-gradient(135deg, ${t.ORANGE}, ${t.ORANGE_DARK})`,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 10px 24px rgba(239,159,39,.22)',
  }

  const errorInput = (field: string): CSSProperties =>
    errors[field]
      ? {
          border: `1px solid rgba(226,75,74,.45)`,
          background: 'rgba(226,75,74,.06)',
        }
      : {}

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: t.BG_PAGE,
          color: t.TEXT_MAIN,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600;700&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <Spinner dark={t.dark} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pf-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: start;
        }

        .pf-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .pf-three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .pf-sticky {
          position: sticky;
          top: 98px;
        }

        .pf-status-btn {
          transition: .18s ease;
        }

        .pf-status-btn:hover {
          transform: translateY(-1px);
        }

        .pf-field:focus,
        .pf-textarea:focus,
        .pf-select:focus {
          border-color: rgba(239,159,39,.5) !important;
          box-shadow: 0 0 0 4px rgba(239,159,39,.12);
        }

        @media (max-width: 980px) {
          .pf-grid {
            grid-template-columns: 1fr;
          }

          .pf-sticky {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .pf-two,
          .pf-three {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: t.BG_PAGE,
          color: t.TEXT_MAIN,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {toast && <Toast {...toast} />}

        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backdropFilter: 'blur(14px)',
            background: t.BG_STICKY,
            borderBottom: `1px solid ${t.DIVIDER}`,
          }}
        >
          <div
            style={{
              maxWidth: 1380,
              margin: '0 auto',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-.03em',
                  margin: 0,
                  color: t.TEXT_MAIN,
                }}
              >
                {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  color: t.TEXT_MUTED,
                }}
              >
                {isEdit
                  ? 'Mettez à jour les informations du produit'
                  : 'Remplissez les informations du produit'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => router.back()} style={btnSecondary}>
                Annuler
              </button>

              <button form="product-form" type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.72 : 1 }}>
                {saving && <Spinner dark={false} />}
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <form id="product-form" onSubmit={handleSubmit}>
          <div style={{ maxWidth: 1380, margin: '0 auto', padding: '24px' }}>
            <div className="pf-grid">
              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Général */}
                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Informations générales</h2>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>
                        Nom du produit <span style={{ color: t.RED }}>*</span>
                      </label>
                      <input
                        className="pf-field"
                        type="text"
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex : Logiciel de gestion MFI"
                        style={{ ...inputStyle, ...errorInput('name') }}
                      />
                      {errors.name && (
                        <p style={{ margin: '7px 0 0', fontSize: 12, color: t.RED }}>{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Slug (URL) <span style={{ color: t.RED }}>*</span>
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                        <input
                          className="pf-field"
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          onFocus={() => setSlugLocked(true)}
                          placeholder="mon-produit"
                          style={{
                            ...inputStyle,
                            fontFamily: 'monospace',
                            ...errorInput('slug'),
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setSlugLocked(false)
                            setForm((f) => ({ ...f, slug: slugify(f.name) }))
                          }}
                          style={btnSecondary}
                        >
                          Régénérer
                        </button>
                      </div>

                      {errors.slug && (
                        <p style={{ margin: '7px 0 0', fontSize: 12, color: t.RED }}>{errors.slug}</p>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Description courte</label>
                      <textarea
                        className="pf-textarea"
                        rows={4}
                        value={form.excerpt}
                        onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                        placeholder="Résumé du produit en quelques phrases…"
                        style={{
                          ...inputStyle,
                          resize: 'vertical',
                          minHeight: 120,
                          lineHeight: 1.6,
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* Prix + catégorie + statut */}
                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Prix, catégorie & publication</h2>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="pf-two">
                      <div>
                        <label style={labelStyle}>Prix (MGA)</label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: t.TEXT_DIM,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            Ar
                          </span>
                          <input
                            className="pf-field"
                            type="number"
                            min="0"
                            step="100"
                            value={form.price}
                            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                            placeholder="0"
                            style={{
                              ...inputStyle,
                              paddingLeft: 40,
                              ...errorInput('price'),
                            }}
                          />
                        </div>
                        {errors.price && (
                          <p style={{ margin: '7px 0 0', fontSize: 12, color: t.RED }}>{errors.price}</p>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>Catégorie</label>
                        <select
                          className="pf-select"
                          value={form.categoryId}
                          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                          style={inputStyle}
                        >
                          <option value="">Sans catégorie</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Statut</label>
                      <div className="pf-three">
                        {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => {
                          const st = statusStyle(s, t)
                          const active = form.status === s

                          return (
                            <button
                              key={s}
                              type="button"
                              className="pf-status-btn"
                              onClick={() => setForm((f) => ({ ...f, status: s }))}
                              style={{
                                padding: '14px 14px',
                                borderRadius: 14,
                                border: `1px solid ${active ? st.border : t.BORDER}`,
                                background: active ? st.bg : t.BG_INPUT,
                                color: active ? st.color : t.TEXT_MUTED,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'inherit',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: st.color,
                                  }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{st.label}</span>
                              </div>
                              <span style={{ fontSize: 12, color: active ? st.color : t.TEXT_DIM }}>
                                {s === 'DRAFT'
                                  ? 'Visible seulement en brouillon'
                                  : s === 'PUBLISHED'
                                  ? 'Rendu public immédiatement'
                                  : 'Retiré de la publication'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Média */}
                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Média</h2>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>URL de l’image principale</label>
                      <input
                        className="pf-field"
                        type="url"
                        value={form.coverImage}
                        onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                        placeholder="https://..."
                        style={{ ...inputStyle, ...errorInput('coverImage') }}
                      />
                      {errors.coverImage && (
                        <p style={{ margin: '7px 0 0', fontSize: 12, color: t.RED }}>{errors.coverImage}</p>
                      )}
                    </div>

                    <div
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: `1px solid ${t.BORDER}`,
                        background: t.BG_INPUT,
                        minHeight: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {form.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.coverImage}
                          alt="Aperçu"
                          style={{ width: '100%', height: 320, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: t.TEXT_DIM, padding: 20 }}>
                          <div style={{ fontSize: 34, marginBottom: 8 }}>🖼️</div>
                          <div style={{ fontSize: 13 }}>Aperçu de l’image principale</div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Contenu HTML */}
                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Contenu HTML (optionnel)</h2>
                  </div>

                  <div style={{ padding: 20 }}>
                    <label style={labelStyle}>gjsHtml</label>
                    <textarea
                      className="pf-textarea"
                      rows={10}
                      value={form.gjsHtml}
                      onChange={(e) => setForm((f) => ({ ...f, gjsHtml: e.target.value }))}
                      placeholder="<section>...</section>"
                      style={{
                        ...inputStyle,
                        resize: 'vertical',
                        minHeight: 220,
                        lineHeight: 1.6,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </section>
              </div>

              {/* RIGHT */}
              <aside className="pf-sticky" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Résumé</h2>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div
                      style={{
                        height: 180,
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: `1px solid ${t.BORDER}`,
                        background: t.BG_INPUT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {form.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.coverImage}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: 28, color: t.TEXT_DIM }}>📦</span>
                      )}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: form.name ? t.TEXT_MAIN : t.TEXT_DIM,
                        }}
                      >
                        {form.name || 'Nom du produit'}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: t.TEXT_DIM }}>
                        /{form.slug || 'slug-produit'}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 10px',
                        width: 'fit-content',
                        borderRadius: 999,
                        background: currentStatus.bg,
                        border: `1px solid ${currentStatus.border}`,
                        color: currentStatus.color,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: currentStatus.color,
                        }}
                      />
                      {currentStatus.label}
                    </div>

                    <div style={{ borderTop: `1px solid ${t.DIVIDER}`, paddingTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: t.TEXT_DIM }}>Prix</span>
                        <strong style={{ fontSize: 13, color: t.TEXT_MAIN }}>{formatPrice(form.price)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: t.TEXT_DIM }}>Catégorie</span>
                        <strong style={{ fontSize: 13, color: t.TEXT_MAIN }}>
                          {categories.find((c) => c.id === form.categoryId)?.name || '—'}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 12, color: t.TEXT_DIM }}>Auteur</span>
                        <strong style={{ fontSize: 13, color: t.TEXT_MAIN }}>
                          {authorId === 'YOUR_CURRENT_USER_ID' ? 'À définir' : 'Session user'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section style={card}>
                  <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.DIVIDER}` }}>
                    <h2 style={sectionTitle}>Actions rapides</h2>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="submit" form="product-form" disabled={saving} style={{ ...btnPrimary, justifyContent: 'center', opacity: saving ? 0.72 : 1 }}>
                      {saving && <Spinner dark={false} />}
                      {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
                    </button>

                    <button type="button" onClick={() => router.push('/admin/products')} style={{ ...btnSecondary, width: '100%' }}>
                      Retour à la liste
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/admin/product-categories')}
                      style={{ ...btnSecondary, width: '100%' }}
                    >
                      Gérer les catégories
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}