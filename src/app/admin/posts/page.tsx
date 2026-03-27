'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
type SortField = 'createdAt' | 'updatedAt' | 'title' | 'status' | 'publishedAt'
type SortDir = 'asc' | 'desc'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  status: PostStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  authorId: string
  categoryId: string | null
  author: { id: string; email: string } | null
  category: { id: string; name: string; slug: string } | null
  tags: { tagId: string }[]
}

type Category = {
  id: string
  name: string
  slug: string
  _count?: { posts: number }
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ORANGE = '#EF9F27'
const ORANGE_DARK = '#c97d15'
const ORANGE_SOFT = '#fff4e5'

const STATUS_CFG: Record<PostStatus, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT: {
    label: 'Brouillon',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,.12)',
    dot: '#94a3b8',
  },
  PUBLISHED: {
    label: 'Publié',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,.12)',
    dot: '#1D9E75',
  },
  ARCHIVED: {
    label: 'Archivé',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,.12)',
    dot: '#f59e0b',
  },
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(text?: string | null, max = 90) {
  if (!text) return 'Aucun extrait'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function useTokens() {
  const { dark } = useTheme()

  return {
    dark,
    bgPage: dark
      ? 'linear-gradient(180deg, #0f0d09 0%, #16110a 52%, #120d06 100%)'
      : 'linear-gradient(180deg, #fffdf9 0%, #fff8ef 52%, #fffaf3 100%)',
    bgCard: dark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.86)',
    bgCardStrong: dark ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.95)',
    bgInput: dark ? 'rgba(255,255,255,.05)' : '#ffffff',
    bgHero: dark ? 'rgba(239,159,39,.10)' : 'rgba(239,159,39,.08)',
    bgAccentSoft: dark ? 'rgba(239,159,39,.12)' : 'rgba(239,159,39,.10)',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(201,125,21,.10)',
    borderSoft: dark ? 'rgba(255,255,255,.05)' : 'rgba(201,125,21,.06)',
    text: dark ? '#f7f3eb' : '#1a140b',
    textSoft: dark ? 'rgba(255,255,255,.68)' : 'rgba(26,20,11,.62)',
    textMute: dark ? 'rgba(255,255,255,.42)' : 'rgba(26,20,11,.38)',
    rowHover: dark ? 'rgba(239,159,39,.08)' : 'rgba(239,159,39,.05)',
    selected: dark ? 'rgba(239,159,39,.12)' : 'rgba(239,159,39,.10)',
    badgeBg: dark ? 'rgba(255,255,255,.05)' : 'rgba(239,159,39,.06)',
    shadow: dark
      ? '0 20px 60px rgba(0,0,0,.35)'
      : '0 20px 60px rgba(180,110,20,.12)',
  }
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function IconPublish() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function IconUnpublish() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v12" />
      <path d="m17 15-5 5-5-5" />
      <path d="M5 4h14" />
    </svg>
  )
}

function IconArticles() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  )
}

function IconDraft() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    </svg>
  )
}

function IconPublished() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m20 6-11 11-5-5" />
    </svg>
  )
}

function IconCategory() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13V7a2 2 0 0 0-2-2h-6l-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
      <path d="M15 19l2 2 4-4" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function AccessDenied({ code }: { code: 401 | 403 }) {
  const t = useTokens()

  return (
    <div style={{ minHeight: '65vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h2 style={{ color: t.text, fontSize: 24, marginBottom: 8 }}>
          {code === 401 ? 'Session expirée' : 'Accès refusé'}
        </h2>
        <p style={{ color: t.textSoft, lineHeight: 1.7 }}>
          {code === 401
            ? 'Reconnectez-vous pour continuer.'
            : "Vous n'avez pas la permission d'accéder à la gestion des articles."}
        </p>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 10 }}>
          {code === 401 && (
            <a
              href="/login"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#fff',
                background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
              }}
            >
              Se connecter
            </a>
          )}
          <a
            href="/admin"
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              textDecoration: 'none',
              color: t.textSoft,
              border: `1px solid ${t.border}`,
            }}
          >
            Retour admin
          </a>
        </div>
      </div>
    </div>
  )
}

function Toast({
  message,
  type,
}: {
  message: string
  type: 'ok' | 'err'
}) {
  const bg = type === 'ok' ? 'rgba(29,158,117,.96)' : 'rgba(226,75,74,.96)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        background: bg,
        color: '#fff',
        borderRadius: 14,
        padding: '12px 16px',
        boxShadow: '0 14px 30px rgba(0,0,0,.25)',
        animation: 'toastIn .22s ease',
      }}
    >
      {message}
    </div>
  )
}

function ActionIconButton({
  title,
  onClick,
  children,
  fg,
  bg,
  border,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
  fg: string
  bg: string
  border: string
}) {
  return (
    <button
      className="action-btn icon-action-btn"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        border: `1px solid ${border}`,
        background: bg,
        color: fg,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export default function AdminPostsPage() {
  const router = useRouter()
  const t = useTokens()

  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState<401 | 403 | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'err' } | null>(null)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  const hasFilters = Boolean(search || category || status !== 'all')
  const someSelected = selected.size > 0
  const allSelected = posts.length > 0 && selected.size === posts.length

  const showToast = (message: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setAccessError(null)

    try {
      const params = new URLSearchParams({
        scope: 'backoffice',
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
        status,
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
      })

      const res = await api.get(`/api/articles/public?${params}`)

      setPosts(res.data?.data ?? [])
      setCategories(res.data?.categories ?? [])
      setPagination(
        res.data?.pagination ?? {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        }
      )
      setSelected(new Set())
    } catch (error: any) {
      const code = error?.response?.status
      if (code === 401 || code === 403) {
        setAccessError(code)
      } else {
        showToast('Erreur lors du chargement des articles', 'err')
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, sortDir, search, status, category])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    setPage(1)
  }, [search, status, category, limit, sortBy, sortDir])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === posts.length) return new Set()
      return new Set(posts.map((p) => p.id))
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setCategory('')
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement "${title}" ?`)) return

    try {
      await api.delete(`/api/posts/${id}`)
      showToast('Article supprimé')
      fetchPosts()
    } catch {
      showToast('Erreur lors de la suppression', 'err')
    }
  }

  const handleBulkDelete = async () => {
    if (!selected.size) return
    if (!window.confirm(`Supprimer ${selected.size} article(s) ?`)) return

    try {
      await Promise.all([...selected].map((id) => api.delete(`/api/posts/${id}`)))
      showToast('Suppression terminée')
      fetchPosts()
    } catch {
      showToast('Erreur lors de la suppression groupée', 'err')
    }
  }

  const handleTogglePublish = async (post: Post) => {
    const nextStatus: PostStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    try {
      await api.patch(`/api/posts/${post.id}`, { status: nextStatus })
      showToast(nextStatus === 'PUBLISHED' ? 'Article publié' : 'Article remis en brouillon')
      fetchPosts()
    } catch {
      showToast('Erreur lors du changement de statut', 'err')
    }
  }

  const pageNumbers = useMemo(() => {
    const arr: number[] = []
    const total = pagination.totalPages
    const start = Math.max(1, page - 2)
    const end = Math.min(total, page + 2)

    for (let i = start; i <= end; i += 1) arr.push(i)
    return arr
  }, [page, pagination.totalPages])

  if (accessError) return <AccessDenied code={accessError} />

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        @keyframes floatGlow {
          0% { transform: translateY(0px); opacity: .9; }
          50% { transform: translateY(-8px); opacity: 1; }
          100% { transform: translateY(0px); opacity: .9; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .post-admin-root {
          position: relative;
        }

        .post-admin-root::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 300px;
          background:
            radial-gradient(circle at 14% 24%, rgba(239,159,39,.17), transparent 34%),
            radial-gradient(circle at 84% 12%, rgba(239,159,39,.10), transparent 30%);
          pointer-events: none;
          z-index: 0;
          animation: floatGlow 7s ease-in-out infinite;
        }

        .post-shell {
          position: relative;
          z-index: 1;
          animation: fadeSlideUp .35s ease;
        }

        .post-row {
          transition: background .18s ease, transform .18s ease;
        }

        .post-row:hover {
          background: ${t.rowHover};
        }

        .action-btn {
          transition: transform .16s ease, opacity .16s ease, box-shadow .16s ease, background .16s ease;
        }

        .action-btn:hover {
          opacity: .96;
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 10px 20px rgba(0,0,0,.08);
        }

        .post-editorial-card {
          backdrop-filter: blur(10px);
          box-shadow: ${t.shadow};
        }

        .post-kpi {
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
        }

        .post-kpi:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(239,159,39,.12);
        }

        .post-cover {
          transition: transform .22s ease;
        }

        .post-row:hover .post-cover {
          transform: scale(1.06);
        }

        .post-title-link {
          transition: color .18s ease;
        }

        .post-row:hover .post-title-link {
          color: ${ORANGE};
        }

        .post-toolbar select option {
          background: ${t.dark ? '#16110a' : '#ffffff'};
          color: ${t.text};
        }

        .post-toolbar input::placeholder {
          color: ${t.textMute};
        }

        .icon-action-btn svg,
        .icon-chip svg,
        .hero-btn svg,
        .stat-icon svg,
        .filter-icon svg,
        .pager-btn svg {
          pointer-events: none;
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div
        className="post-admin-root"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: t.text,
          background: t.bgPage,
          minHeight: '100vh',
          padding: '24px',
          borderRadius: 24,
        }}
      >
        <div className="post-shell">
          <div
            style={{
              marginBottom: 22,
              padding: '24px 24px 20px',
              borderRadius: 24,
              background: t.bgHero,
              border: `1px solid ${t.border}`,
              boxShadow: t.shadow,
              display: 'grid',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: t.bgAccentSoft,
                    color: ORANGE_DARK,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  <IconArticles />
                  Éditorial
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'roboto', sans-serif",
                    fontSize: 34,
                    lineHeight: 1.05,
                    fontWeight: 800,
                    letterSpacing: '-.03em',
                    color: t.text,
                  }}
                >
                  Articles & Publications
                </h1>

                <p
                  style={{
                    margin: '10px 0 0',
                    color: t.textSoft,
                    maxWidth: 720,
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  Gérez vos contenus éditoriaux, suivez leur statut et pilotez vos publications
                  avec une interface dynamique, plus visuelle et plus moderne.
                </p>
              </div>

              <button
                className="hero-btn action-btn"
                onClick={() => router.push('/admin/posts/new')}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 10px 26px rgba(239,159,39,.30)',
                }}
              >
                <IconPlus />
                <span>Nouvel article</span>
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div
                className="post-kpi"
                style={{
                  borderRadius: 18,
                  border: `1px solid ${t.border}`,
                  background: t.bgCardStrong,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  className="stat-icon"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'rgba(239,159,39,.12)',
                    color: ORANGE,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconArticles />
                </div>
                <div>
                  <div style={{ color: t.textMute, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Total
                  </div>
                  <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800 }}>{pagination.total}</div>
                </div>
              </div>

              <div
                className="post-kpi"
                style={{
                  borderRadius: 18,
                  border: `1px solid ${t.border}`,
                  background: t.bgCardStrong,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  className="stat-icon"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'rgba(148,163,184,.12)',
                    color: '#94a3b8',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconDraft />
                </div>
                <div>
                  <div style={{ color: t.textMute, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Brouillons
                  </div>
                  <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800, color: '#94a3b8' }}>
                    {posts.filter((p) => p.status === 'DRAFT').length}
                  </div>
                </div>
              </div>

              <div
                className="post-kpi"
                style={{
                  borderRadius: 18,
                  border: `1px solid ${t.border}`,
                  background: t.bgCardStrong,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  className="stat-icon"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'rgba(29,158,117,.12)',
                    color: '#1D9E75',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconPublished />
                </div>
                <div>
                  <div style={{ color: t.textMute, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Publiés
                  </div>
                  <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800, color: '#1D9E75' }}>
                    {posts.filter((p) => p.status === 'PUBLISHED').length}
                  </div>
                </div>
              </div>

              <div
                className="post-kpi"
                style={{
                  borderRadius: 18,
                  border: `1px solid ${t.border}`,
                  background: t.bgCardStrong,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  className="stat-icon"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: 'rgba(239,159,39,.12)',
                    color: ORANGE,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <IconCategory />
                </div>
                <div>
                  <div style={{ color: t.textMute, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Catégories
                  </div>
                  <div style={{ marginTop: 4, fontSize: 26, fontWeight: 800, color: ORANGE }}>
                    {categories.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="post-editorial-card post-toolbar"
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 22,
              padding: 18,
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div
                className="filter-icon"
                style={{
                  flex: '1 1 260px',
                  minWidth: 220,
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: t.textMute,
                    display: 'inline-flex',
                  }}
                >
                  <IconSearch />
                </span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: `1px solid ${t.border}`,
                    background: t.bgInput,
                    color: t.text,
                    padding: '12px 14px 12px 40px',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="Statut"
                style={{
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: t.bgInput,
                  color: t.text,
                  padding: '12px 14px',
                  outline: 'none',
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="ARCHIVED">Archivé</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                title="Catégorie"
                style={{
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: t.bgInput,
                  color: t.text,
                  padding: '12px 14px',
                  outline: 'none',
                }}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}{cat._count?.posts ? ` (${cat._count.posts})` : ''}
                  </option>
                ))}
              </select>

              <select
                value={`${sortBy}:${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(':')
                  setSortBy(field as SortField)
                  setSortDir(dir as SortDir)
                }}
                title="Tri"
                style={{
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: t.bgInput,
                  color: t.text,
                  padding: '12px 14px',
                  outline: 'none',
                }}
              >
                <option value="createdAt:desc">Création ↓</option>
                <option value="createdAt:asc">Création ↑</option>
                <option value="updatedAt:desc">Maj ↓</option>
                <option value="updatedAt:asc">Maj ↑</option>
                <option value="title:asc">Titre A→Z</option>
                <option value="title:desc">Titre Z→A</option>
                <option value="status:asc">Statut ↑</option>
                <option value="status:desc">Statut ↓</option>
                <option value="publishedAt:desc">Publication ↓</option>
                <option value="publishedAt:asc">Publication ↑</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                title="Nombre par page"
                style={{
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: t.bgInput,
                  color: t.text,
                  padding: '12px 14px',
                  outline: 'none',
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>

              {hasFilters && (
                <button
                  className="action-btn icon-chip"
                  onClick={clearFilters}
                  title="Réinitialiser"
                  aria-label="Réinitialiser"
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${t.border}`,
                    background: t.badgeBg,
                    color: ORANGE,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IconReset />
                </button>
              )}
            </div>

            {someSelected && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: `1px solid ${t.borderSoft}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: ORANGE, fontWeight: 700 }}>
                  {selected.size} sélectionné(s)
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionIconButton
                    title="Supprimer sélection"
                    onClick={handleBulkDelete}
                    fg="#e24b4a"
                    bg="rgba(226,75,74,.12)"
                    border="rgba(226,75,74,.24)"
                  >
                    <IconTrash />
                  </ActionIconButton>

                  <button
                    onClick={() => setSelected(new Set())}
                    style={{
                      background: t.badgeBg,
                      color: t.textSoft,
                      border: `1px solid ${t.border}`,
                      borderRadius: 12,
                      padding: '9px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="post-editorial-card"
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 22,
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div style={{ padding: '54px 20px', textAlign: 'center', color: t.textSoft }}>
                Chargement…
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: '54px 20px', textAlign: 'center', color: t.textSoft }}>
                Aucun article trouvé.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ padding: 14, width: 46 }}>
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                      </th>
                      <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Publication
                      </th>
                      <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Catégorie
                      </th>
                      <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Statut
                      </th>
                      <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Auteur
                      </th>
                      <th style={{ padding: 14, textAlign: 'left', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Création
                      </th>
                      <th style={{ padding: 14, textAlign: 'right', fontSize: 11, color: t.textMute, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {posts.map((post) => {
                      const statusCfg = STATUS_CFG[post.status]
                      const isSelected = selected.has(post.id)

                      return (
                        <tr
                          key={post.id}
                          className="post-row"
                          onClick={() => router.push(`/admin/posts/${post.id}/edit`)}
                          style={{
                            borderBottom: `1px solid ${t.borderSoft}`,
                            cursor: 'pointer',
                            background: isSelected ? t.selected : 'transparent',
                          }}
                        >
                          <td style={{ padding: 14 }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(post.id)}
                            />
                          </td>

                          <td style={{ padding: 14, minWidth: 340 }}>
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 16,
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  background: t.badgeBg,
                                  border: `1px solid ${t.border}`,
                                }}
                              >
                                {post.coverImage ? (
                                  <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="post-cover"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'grid',
                                      placeItems: 'center',
                                      color: t.textMute,
                                      fontSize: 11,
                                    }}
                                  >
                                    Img
                                  </div>
                                )}
                              </div>

                              <div>
                                <div
                                  className="post-title-link"
                                  style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 20,
                                    lineHeight: 1.15,
                                    color: t.text,
                                  }}
                                >
                                  {post.title}
                                </div>
                                <div style={{ fontSize: 12, color: ORANGE, marginTop: 4 }}>
                                  /{post.slug}
                                </div>
                                <div style={{ fontSize: 12, color: t.textSoft, marginTop: 8, lineHeight: 1.6 }}>
                                  {truncate(post.excerpt)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: 14, color: t.textSoft }}>
                            {post.category ? post.category.name : '—'}
                          </td>

                          <td style={{ padding: 14 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 11px',
                                borderRadius: 999,
                                color: statusCfg.color,
                                background: statusCfg.bg,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: statusCfg.dot,
                                }}
                              />
                              {statusCfg.label}
                            </span>
                          </td>

                          <td style={{ padding: 14, color: t.textSoft }}>
                            {post.author?.email ?? '—'}
                          </td>

                          <td style={{ padding: 14, color: t.textSoft }}>
                            {fmtDate(post.createdAt)}
                          </td>

                          <td style={{ padding: 14 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <ActionIconButton
                                title="Modifier"
                                onClick={() => router.push(`/admin/posts/${post.id}/edit`)}
                                fg={t.text}
                                bg={t.badgeBg}
                                border={t.border}
                              >
                                <IconEdit />
                              </ActionIconButton>

                              <ActionIconButton
                                title={post.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                                onClick={() => handleTogglePublish(post)}
                                fg={post.status === 'PUBLISHED' ? '#f59e0b' : ORANGE}
                                bg={post.status === 'PUBLISHED' ? 'rgba(245,166,35,.12)' : 'rgba(239,159,39,.12)'}
                                border={post.status === 'PUBLISHED' ? 'rgba(245,166,35,.24)' : 'rgba(239,159,39,.24)'}
                              >
                                {post.status === 'PUBLISHED' ? <IconUnpublish /> : <IconPublish />}
                              </ActionIconButton>

                              <ActionIconButton
                                title="Supprimer"
                                onClick={() => handleDelete(post.id, post.title)}
                                fg="#e24b4a"
                                bg="rgba(226,75,74,.12)"
                                border="rgba(226,75,74,.24)"
                              >
                                <IconTrash />
                              </ActionIconButton>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && pagination.totalPages > 1 && (
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="action-btn pager-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  width: 40,
                  height: 40,
                  border: `1px solid ${t.border}`,
                  background: t.badgeBg,
                  color: t.textSoft,
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page <= 1 ? 'default' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
                aria-label="Page précédente"
              >
                <IconChevronLeft />
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  className="action-btn"
                  onClick={() => setPage(p)}
                  style={{
                    border: `1px solid ${p === page ? ORANGE : t.border}`,
                    background: p === page ? 'rgba(239,159,39,.12)' : t.badgeBg,
                    color: p === page ? ORANGE : t.textSoft,
                    borderRadius: 12,
                    padding: '9px 13px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    minWidth: 42,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                className="action-btn pager-btn"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                style={{
                  width: 40,
                  height: 40,
                  border: `1px solid ${t.border}`,
                  background: t.badgeBg,
                  color: t.textSoft,
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page >= pagination.totalPages ? 'default' : 'pointer',
                  opacity: page >= pagination.totalPages ? 0.4 : 1,
                }}
                aria-label="Page suivante"
              >
                <IconChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}