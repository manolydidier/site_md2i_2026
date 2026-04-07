'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type SortField = 'createdAt' | 'name' | 'price' | 'status' | 'publishedAt'
type SortDir = 'asc' | 'desc'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  excerpt: string | null
  price: string | null
  coverImage: string | null
  status: ProductStatus
  publishedAt: string | null
  createdAt: string
  updatedAt?: string | null
  category: Category | null
  author?: {
    id: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const ORANGE = '#EF9F27'
const ORANGE_DARK = '#c97d15'

const STATUS_CFG: Record<ProductStatus, { label: string; color: string; bg: string; dot: string }> = {
  PUBLISHED: { label: 'Publié', color: '#1D9E75', bg: 'rgba(29,158,117,.12)', dot: '#1D9E75' },
  DRAFT: { label: 'Brouillon', color: '#f5a623', bg: 'rgba(245,166,35,.12)', dot: '#f5a623' },
  ARCHIVED: { label: 'Archivé', color: '#7c8799', bg: 'rgba(124,135,153,.14)', dot: '#7c8799' },
}

const SORT_LABELS: Record<SortField, string> = {
  createdAt: 'Date création',
  name: 'Nom',
  price: 'Prix',
  status: 'Statut',
  publishedAt: 'Publication',
}

const LIMIT_OPTIONS = [10, 20, 50, 100]

const VISIBLE_COLS_DEFAULT = {
  image: true,
  name: true,
  category: true,
  price: true,
  status: true,
  publishedAt: true,
  createdAt: false,
  actions: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function fmtPrice(price: string | null) {
  if (!price || Number.isNaN(Number(price))) return '—'
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    maximumFractionDigits: 0,
  }).format(Number(price))
}

function excerptText(product: Product) {
  return product.excerpt?.trim() || product.slug
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useTokens() {
  const { dark } = useTheme()
  return {
    dark,
    BG_CARD: dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.03)',
    BG_MODAL: dark ? '#111116' : '#ffffff',
    BG_DRAWER: dark ? '#0d0d12' : '#f8f6f2',
    BG_INPUT: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    BG_BTN: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    BORDER: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)',
    BORDER_INP: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.12)',
    BORDER_MOD: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)',
    TEXT_MAIN: dark ? '#f0ede8' : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.45)',
    TEXT_DIM: dark ? 'rgba(255,255,255,.26)' : 'rgba(0,0,0,.3)',
    TEXT_LABEL: dark ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.38)',
    TEXT_SECTION: dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.25)',
    ROW_HOVER: dark ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.025)',
    ROW_SEL: dark ? 'rgba(239,159,39,.05)' : 'rgba(239,159,39,.07)',
    SCROLLBAR: dark ? 'rgba(239,159,39,.2)' : 'rgba(239,159,39,.35)',
    BTN_TEXT: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)',
    BTN_BORDER: dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.1)',
    CANCEL_CLR: dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)',
    DIVIDER: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)',
    SPIN_TRACK: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    EMPTY_ICON: dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.15)',
    HEADER_SUB: dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.38)',
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
        zIndex: 400,
        padding: '12px 20px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 500,
        background: bg,
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,.35)',
        animation: 'toastIn .22s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 360,
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span> {msg}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ spinTrack }: { spinTrack: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        border: `2.5px solid ${spinTrack}`,
        borderTopColor: ORANGE,
        borderRadius: '50%',
        animation: 'spin .65s linear infinite',
        margin: '0 auto',
      }}
    />
  )
}

// ─── Modal Confirmation ───────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  danger,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
}: {
  title?: string
  message: string
  danger?: boolean
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTokens()
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: t.BG_MODAL,
          border: `1px solid ${t.BORDER_MOD}`,
          borderRadius: 20,
          padding: '2rem',
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 32px 64px rgba(0,0,0,.4)',
          animation: 'modalIn .22s ease',
        }}
      >
        {title && (
          <h3 style={{ color: t.TEXT_MAIN, fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>
            {title}
          </h3>
        )}
        <p style={{ color: t.TEXT_MUTED, fontSize: 14, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              border: `1px solid ${t.BORDER_INP}`,
              background: 'none',
              color: t.CANCEL_CLR,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              border: 'none',
              background: danger ? '#e24b4a' : `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer détails produit ───────────────────────────────────────────────────
function ProductDrawer({
  product,
  onClose,
  onDelete,
}: {
  product: Product
  onClose: () => void
  onDelete: () => void
}) {
  const t = useTokens()
  const sc = STATUS_CFG[product.status]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }} />
      <div
        style={{
          width: 380,
          background: t.BG_DRAWER,
          borderLeft: `1px solid ${t.BORDER}`,
          height: '100%',
          overflowY: 'auto',
          animation: 'drawerIn .28s cubic-bezier(.22,1,.36,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${t.DIVIDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: t.BG_INPUT,
                border: `1px solid ${t.BORDER}`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px rgba(239,159,39,.18)`,
                flexShrink: 0,
              }}
            >
              {product.coverImage ? (
                <Image src={product.coverImage} alt={product.name} width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 22, opacity: 0.55 }}>📦</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.TEXT_MAIN }}>{product.name}</div>
              <div style={{ fontSize: 12, color: t.TEXT_DIM }}>{product.slug}</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot }} />
                <span style={{ fontSize: 11.5, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${t.BORDER_INP}`,
              background: 'none',
              color: t.TEXT_MUTED,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
          {[
            { label: 'Prix', value: fmtPrice(product.price), icon: '💰' },
            { label: 'Catégorie', value: product.category?.name ?? '—', icon: '🏷' },
            { label: 'Publication', value: fmtDate(product.publishedAt, true), icon: '🗓' },
            { label: 'Création', value: fmtDate(product.createdAt, true), icon: '📅' },
            {
              label: 'Auteur',
              value: product.author ? [product.author.firstName, product.author.lastName].filter(Boolean).join(' ') || '—' : '—',
              icon: '👤',
            },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${t.DIVIDER}` }}>
              <span style={{ fontSize: 14, width: 22, flexShrink: 0, opacity: 0.55 }}>{icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.8px',
                    textTransform: 'uppercase',
                    color: t.TEXT_DIM,
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 13.5, color: value ? t.TEXT_MAIN : t.TEXT_DIM }}>{value}</div>
              </div>
            </div>
          ))}

          <div style={{ paddingTop: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.8px',
                textTransform: 'uppercase',
                color: t.TEXT_DIM,
                marginBottom: 8,
              }}
            >
              Extrait
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: t.TEXT_MUTED,
                lineHeight: 1.7,
                padding: '12px 14px',
                borderRadius: 12,
                background: t.BG_INPUT,
                border: `1px solid ${t.BORDER}`,
              }}
            >
              {product.excerpt?.trim() || 'Aucun extrait disponible.'}
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${t.DIVIDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link
            href={`/admin/products/${product.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 12,
              border: `1px solid ${t.BORDER_INP}`,
              background: t.BG_BTN,
              color: t.TEXT_MAIN,
              textDecoration: 'none',
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Modifier le produit
          </Link>
          <button
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 12,
              border: '1px solid rgba(226,75,74,.22)',
              background: 'rgba(226,75,74,.07)',
              color: '#e24b4a',
              cursor: 'pointer',
              fontSize: 13.5,
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Supprimer le produit
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Colonnes visibles ────────────────────────────────────────────────────────
function ColsDropdown({
  cols,
  setCols,
}: {
  cols: typeof VISIBLE_COLS_DEFAULT
  setCols: React.Dispatch<React.SetStateAction<typeof VISIBLE_COLS_DEFAULT>>
}) {
  const t = useTokens()
  const labels: Record<keyof typeof VISIBLE_COLS_DEFAULT, string> = {
    image: 'Image',
    name: 'Produit',
    category: 'Catégorie',
    price: 'Prix',
    status: 'Statut',
    publishedAt: 'Publication',
    createdAt: 'Création',
    actions: 'Actions',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 9000,
        background: t.BG_MODAL,
        border: `1px solid ${t.BORDER_INP}`,
        borderRadius: 14,
        padding: '8px',
        minWidth: 220,
        boxShadow: '0 12px 36px rgba(0,0,0,.25)',
        animation: 'dropIn .18s ease',
      
      }}
    >
      <div
        style={{
          padding: '6px 10px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: t.TEXT_DIM,
          borderBottom: `1px solid ${t.DIVIDER}`,
          marginBottom: 6,
        }}
      >
        Colonnes visibles
      </div>
      {(Object.keys(labels) as (keyof typeof VISIBLE_COLS_DEFAULT)[]).map((k) => (
        <label
          key={k}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 9,
            cursor: 'pointer',
            transition: 'background .14s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.BG_INPUT)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <div
            onClick={() => setCols((p) => ({ ...p, [k]: !p[k] }))}
            style={{
              width: 16,
              height: 16,
              borderRadius: 5,
              border: `1.5px solid ${cols[k] ? ORANGE : t.BORDER_INP}`,
              background: cols[k] ? ORANGE : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all .15s',
            }}
          >
            {cols[k] && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: t.TEXT_MUTED }}>{labels[k]}</span>
        </label>
      ))}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProductsPage() {
  const t = useTokens()

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres & tri
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Sélection multiple
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Colonnes visibles
  const [cols, setCols] = useState(VISIBLE_COLS_DEFAULT)
  const [showColsPicker, setShowColsPicker] = useState(false)
  const colsRef = useRef<HTMLDivElement>(null)

  // UI
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' | 'warn' } | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [confirm, setConfirm] = useState<{
    title?: string
    message: string
    danger?: boolean
    confirmLabel?: string
    onConfirm: () => void
  } | null>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setShowColsPicker(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    api
      .get('/api/product-categories?limit=100')
      .then((r) => setCategories(r.data?.data ?? []))
      .catch(console.error)
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(status && { status }),
        ...(categoryId && { categoryId }),
      })

      const res = await api.get(`/api/products?${params.toString()}`)
      const data = res.data?.data ?? []
      const meta = res.data?.pagination ?? res.data?.meta ?? {
        page,
        limit,
        total: data.length,
        totalPages: 1,
      }

      setProducts(data)
      setPagination(meta)
      setSelected(new Set())
    } catch (e) {
      console.error(e)
      showToast('Erreur lors du chargement', 'err')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, status, categoryId, sortBy, sortDir])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [search, status, categoryId, limit, sortBy, sortDir])

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
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const toggleAll = () =>
    setSelected((s) => (s.size === products.length ? new Set() : new Set(products.map((p) => p.id))))

  const allSelected = products.length > 0 && selected.size === products.length
  const someSelected = selected.size > 0

  async function performDelete(ids: string[]) {
    try {
      await Promise.all(ids.map((id) => api.delete(`/api/products/${id}`)))
      showToast(ids.length > 1 ? `${ids.length} produit(s) supprimé(s)` : 'Produit supprimé')
      setDetailProduct(null)
      fetchProducts()
    } catch (e) {
      console.error(e)
      showToast('Erreur lors de la suppression', 'err')
    }
  }

  function handleDelete(product: Product) {
    setConfirm({
      title: 'Supprimer le produit',
      message: `Supprimer définitivement « ${product.name} » ? Cette action est irréversible.`,
      danger: true,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        setConfirm(null)
        await performDelete([product.id])
      },
    })
  }

  function handleBulkDelete() {
    const ids = [...selected]
    if (!ids.length) {
      showToast('Aucun produit sélectionné', 'warn')
      return
    }

    setConfirm({
      title: `Supprimer ${ids.length} produit(s)`,
      message: `Supprimer définitivement ${ids.length} produit(s) sélectionné(s) ? Cette action est irréversible.`,
      danger: true,
      confirmLabel: 'Tout supprimer',
      onConfirm: async () => {
        setConfirm(null)
        await performDelete(ids)
      },
    })
  }

  const card: React.CSSProperties = {
    background: t.BG_CARD,
    border: `1px solid ${t.BORDER}`,
    borderRadius: 18,
    overflow: 'hidden',
  }

  const inp: React.CSSProperties = {
    padding: '9px 13px',
    borderRadius: 11,
    border: `1px solid ${t.BORDER_INP}`,
    background: t.BG_INPUT,
    color: t.TEXT_MAIN,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  }

  const btn = (bg = ORANGE, clr = '#fff', extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12.5,
    fontWeight: 600,
    fontFamily: 'inherit',
    background: bg,
    color: clr,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    ...extra,
  })

  const th: React.CSSProperties = {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: t.TEXT_DIM,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  }

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
        .prow:hover { background: ${t.ROW_HOVER} !important; }
        .prow.sel   { background: ${t.ROW_SEL} !important; }
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
        {detailProduct && (
          <ProductDrawer
            product={detailProduct}
            onClose={() => setDetailProduct(null)}
            onDelete={() => handleDelete(detailProduct)}
          />
        )}

        <div
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-.03em',
                color: t.TEXT_MAIN,
              }}
            >
              Produits
            </h1>
            <p style={{ color: t.HEADER_SUB, fontSize: 13, margin: '4px 0 0', fontWeight: 300 }}>
              {loading ? '…' : `${pagination.total} produit${pagination.total !== 1 ? 's' : ''} au total`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/admin/product-categories"
              style={{
                ...btn(t.BG_BTN, t.TEXT_MAIN, { border: `1px solid ${t.BORDER}` }),
                textDecoration: 'none',
              }}
            >
              Catégories
            </Link>
            <Link
              href="/admin/products/new"
              style={{ ...btn(`linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, '#fff'), textDecoration: 'none' }}
            >
              + Nouveau produit
            </Link>
          </div>
        </div>

        <div style={{ ...card, padding: '1rem 1.25rem', marginBottom: '1rem', overflow: 'visible', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 180 }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: t.TEXT_DIM,
                  pointerEvents: 'none',
                }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                style={{ ...inp, paddingLeft: 36, width: '100%' }}
                placeholder="Rechercher un produit…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select style={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>

            <select style={inp} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              style={inp}
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split(':')
                setSortBy(f as SortField)
                setSortDir(d as SortDir)
              }}
            >
              {(Object.keys(SORT_LABELS) as SortField[]).flatMap((f) => [
                <option key={`${f}:asc`} value={`${f}:asc`}>
                  {SORT_LABELS[f]} ↑
                </option>,
                <option key={`${f}:desc`} value={`${f}:desc`}>
                  {SORT_LABELS[f]} ↓
                </option>,
              ])}
            </select>

            <select style={{ ...inp, minWidth: 80 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {LIMIT_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l} / page
                </option>
              ))}
            </select>

            <div ref={colsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowColsPicker((v) => !v)}
                style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}` }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Colonnes
              </button>
              {showColsPicker && <ColsDropdown cols={cols} setCols={setCols} />}
            </div>

            {(search || status || categoryId) && (
              <button
                onClick={() => {
                  setSearch('')
                  setStatus('')
                  setCategoryId('')
                }}
                style={{ ...btn(t.BG_BTN, t.TEXT_MUTED), border: `1px solid ${t.BORDER}` }}
              >
                Réinitialiser ×
              </button>
            )}
          </div>

          {someSelected && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: `1px solid ${t.DIVIDER}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>
                {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={handleBulkDelete}
                style={{ ...btn('rgba(226,75,74,.1)', '#e24b4a'), border: '1px solid rgba(226,75,74,.25)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                Supprimer
              </button>
              <button onClick={() => setSelected(new Set())} style={{ ...btn('none', t.TEXT_MUTED), marginLeft: 'auto' }}>
                Désélectionner tout
              </button>
            </div>
          )}
        </div>

        <div style={card}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <Spinner spinTrack={t.SPIN_TRACK} />
              <p style={{ marginTop: 14, fontSize: 13 }}>Chargement…</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: t.TEXT_DIM }}>
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                style={{ display: 'block', margin: '0 auto 14px', opacity: 0.3 }}
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                <polyline points="12 22.08 12 16.9 7.5 14.3" />
                <polyline points="12 16.9 16.5 14.3" />
                <polyline points="12 6.81 12 12" />
              </svg>
              <p style={{ fontSize: 14, margin: 0 }}>Aucun produit trouvé</p>
              <Link
                href="/admin/products/new"
                style={{
                  ...btn(`linear-gradient(135deg,${ORANGE},${ORANGE_DARK})`, '#fff', { margin: '14px auto 0', width: 'fit-content' }),
                  textDecoration: 'none',
                }}
              >
                Créer le premier produit
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.BORDER}` }}>
                    <th style={{ ...th, width: 44, paddingRight: 0 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    {cols.image && <th style={th}></th>}
                    {cols.name && (
                      <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('name')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Produit <SortIcon field="name" />
                        </span>
                      </th>
                    )}
                    {cols.category && <th style={th}>Catégorie</th>}
                    {cols.price && (
                      <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('price')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Prix <SortIcon field="price" />
                        </span>
                      </th>
                    )}
                    {cols.status && (
                      <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('status')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Statut <SortIcon field="status" />
                        </span>
                      </th>
                    )}
                    {cols.publishedAt && (
                      <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('publishedAt')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Publication <SortIcon field="publishedAt" />
                        </span>
                      </th>
                    )}
                    {cols.createdAt && (
                      <th style={{ ...th, cursor: 'pointer' }} className="th-sort" onClick={() => toggleSort('createdAt')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          Création <SortIcon field="createdAt" />
                        </span>
                      </th>
                    )}
                    {cols.actions && <th style={{ ...th, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const sc = STATUS_CFG[product.status]
                    const isSel = selected.has(product.id)

                    return (
                      <tr
                        key={product.id}
                        className={`prow${isSel ? ' sel' : ''}`}
                        style={{ borderBottom: `1px solid ${t.DIVIDER}`, transition: 'background .13s', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '13px 8px 13px 14px' }} onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(product.id)} />
                        </td>

                        {cols.image && (
                          <td style={{ padding: '13px 4px' }} onClick={() => setDetailProduct(product)}>
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                background: t.BG_INPUT,
                                border: `1px solid ${t.BORDER}`,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 2px 8px rgba(239,159,39,.18)`,
                              }}
                            >
                              {product.coverImage ? (
                                <Image
                                  src={product.coverImage}
                                  alt={product.name}
                                  width={42}
                                  height={42}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: 16, opacity: 0.55 }}>📦</span>
                              )}
                            </div>
                          </td>
                        )}

                        {cols.name && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailProduct(product)}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: t.TEXT_MAIN, whiteSpace: 'nowrap' }}>{product.name}</div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: t.TEXT_DIM,
                                maxWidth: 320,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {excerptText(product)}
                            </div>
                          </td>
                        )}

                        {cols.category && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailProduct(product)}>
                            {product.category ? (
                              <span
                                style={{
                                  fontSize: 11.5,
                                  padding: '3px 9px',
                                  borderRadius: 20,
                                  background: 'rgba(79,163,224,.11)',
                                  color: '#4fa3e0',
                                  fontWeight: 600,
                                  border: '1px solid rgba(79,163,224,.18)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {product.category.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: t.TEXT_DIM }}>—</span>
                            )}
                          </td>
                        )}

                        {cols.price && (
                          <td
                            style={{ padding: '13px 14px', fontSize: 13.5, color: t.TEXT_MAIN, fontWeight: 600, whiteSpace: 'nowrap' }}
                            onClick={() => setDetailProduct(product)}
                          >
                            {fmtPrice(product.price)}
                          </td>
                        )}

                        {cols.status && (
                          <td style={{ padding: '13px 14px' }} onClick={() => setDetailProduct(product)}>
                            <span
                              style={{
                                fontSize: 11.5,
                                padding: '3px 10px',
                                borderRadius: 20,
                                background: sc.bg,
                                color: sc.color,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                              {sc.label}
                            </span>
                          </td>
                        )}

                        {cols.publishedAt && (
                          <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDetailProduct(product)}>
                            {fmtDate(product.publishedAt)}
                          </td>
                        )}

                        {cols.createdAt && (
                          <td style={{ padding: '13px 14px', fontSize: 12.5, color: t.TEXT_DIM, whiteSpace: 'nowrap' }} onClick={() => setDetailProduct(product)}>
                            {fmtDate(product.createdAt)}
                          </td>
                        )}

                        {cols.actions && (
                          <td style={{ padding: '13px 14px' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                              <button
                                className="abtn"
                                onClick={() => setDetailProduct(product)}
                                title="Voir les détails"
                                style={{ ...btn(t.BG_BTN, t.BTN_TEXT), border: `1px solid ${t.BTN_BORDER}`, padding: '6px 9px' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>

                              <Link
                                href={`/admin/products/${product.id}`}
                                className="abtn"
                                title="Modifier"
                                style={{
                                  ...btn(t.BG_BTN, t.BTN_TEXT),
                                  border: `1px solid ${t.BTN_BORDER}`,
                                  padding: '6px 9px',
                                  textDecoration: 'none',
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </Link>

                              <button
                                className="abtn"
                                onClick={() => handleDelete(product)}
                                title="Supprimer"
                                style={{ ...btn('rgba(226,75,74,.08)', '#e24b4a'), border: '1px solid rgba(226,75,74,.2)', padding: '6px 9px' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4h6v2" />
                                </svg>
                              </button>
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
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${t.BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12.5, color: t.TEXT_DIM }}>
                Page {page} / {pagination.totalPages} — {pagination.total} résultat{pagination.total !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  title="Première page"
                  style={{
                    ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN),
                    border: `1px solid ${t.BORDER}`,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    padding: '7px 10px',
                  }}
                >
                  «
                </button>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    ...btn(t.BG_BTN, page <= 1 ? t.TEXT_DIM : t.TEXT_MAIN),
                    border: `1px solid ${t.BORDER}`,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    padding: '7px 11px',
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(7, pagination.totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, pagination.totalPages - 6))
                  const p = start + i
                  if (p > pagination.totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        ...btn(p === page ? ORANGE : t.BG_BTN, p === page ? '#fff' : t.TEXT_MAIN),
                        border: `1.5px solid ${p === page ? 'transparent' : t.BORDER}`,
                        minWidth: 34,
                        padding: '7px 4px',
                        justifyContent: 'center',
                        fontWeight: p === page ? 700 : 500,
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN),
                    border: `1px solid ${t.BORDER}`,
                    cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    padding: '7px 11px',
                  }}
                >
                  ›
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(pagination.totalPages)}
                  title="Dernière page"
                  style={{
                    ...btn(t.BG_BTN, page >= pagination.totalPages ? t.TEXT_DIM : t.TEXT_MAIN),
                    border: `1px solid ${t.BORDER}`,
                    cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    padding: '7px 10px',
                  }}
                >
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
