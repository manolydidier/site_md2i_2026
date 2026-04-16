'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import s from './PublicArticlesPage.module.css'

interface Category {
  id: string
  name: string
  slug?: string
}

interface Article {
  id: string
  title: string
  excerpt: string | null
  createdAt: string
  coverImage?: string | null
  category?: Category | null
}

interface ArticlesResponse {
  data: Article[]
  pagination: { page?: number; limit?: number; total?: number; totalPages: number }
}

interface PublicArticlesPageProps {
  router?: { push: (href: string) => void }
}

type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

const EXCERPT_LIMIT = 120

function useScroll() {
  const [prog, setProg] = useState(0)
  const [top, setTop] = useState(false)

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProg(h > 0 ? (y / h) * 100 : 0)
      setTop(y > 400)
    }

    window.addEventListener('scroll', fn, { passive: true })
    fn()

    return () => window.removeEventListener('scroll', fn)
  }, [])

  return { prog, top }
}

/* ── Icons ── */
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const IconUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const IconFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
)

const IconSort = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M7 12h10M11 18h2" />
  </svg>
)

const IconCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="3" />
  </svg>
)

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform .25s cubic-bezier(.22,.61,.36,1)',
    }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date-desc', label: 'Plus récent' },
  { key: 'date-asc', label: 'Plus ancien' },
  { key: 'title-asc', label: 'A → Z' },
  { key: 'title-desc', label: 'Z → A' },
]

/* ── Excerpt with expand/collapse ── */
function ExcerptBlock({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const raw = text?.trim() || 'Aucun extrait disponible.'
  const isLong = raw.length > EXCERPT_LIMIT

  return (
    <div className={s.excerptWrap}>
      <p className={`${s.cardExcerpt} ${expanded ? s.cardExcerptFull : ''}`}>
        {!isLong || expanded ? raw : raw.slice(0, EXCERPT_LIMIT) + '…'}
      </p>

      {isLong && (
        <button
          className={s.excerptToggle}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          <span>{expanded ? 'Voir moins' : 'Voir plus'}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .3s cubic-bezier(.22,.61,.36,1)',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Glossy Article Card ── */
function ArticleCard({
  article,
  index,
  fmt,
  onNavigate,
}: {
  article: Article
  index: number
  fmt: Intl.DateTimeFormat
  onNavigate: (id: string) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return

    const el = cardRef.current
    const glow = glowRef.current
    if (!el || !glow) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -5
    const rotY = ((x - cx) / cx) * 5

    el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`
    glow.style.background = `radial-gradient(320px circle at ${x}px ${y}px, rgba(255,255,255,0.11), transparent 60%)`
    glow.style.opacity = '1'
  }

  const onMouseLeave = () => {
    const el = cardRef.current
    const glow = glowRef.current
    if (!el || !glow) return
    el.style.transform = ''
    glow.style.opacity = '0'
  }

  const a = article
  const initial = (a.category?.name ?? a.title ?? 'A').charAt(0).toUpperCase()

  return (
    <motion.article
      ref={cardRef}
      className={s.card}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onNavigate(a.id)}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 34, scale: 0.988 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.65,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className={s.gloss} />
      <div className={s.glow} ref={glowRef} />

      <div className={s.media}>
        {a.coverImage ? (
          <img src={a.coverImage} alt={a.title} className={s.img} loading="lazy" />
        ) : (
          <div className={s.placeholder}>
            <span>{initial}</span>
          </div>
        )}
        <div className={s.imgGloss} />
        {a.category?.name && <div className={s.badgeCat}>{a.category.name}</div>}
      </div>

      <div className={s.body}>
        <div className={s.dateLine}>
          <IconCal />
          <span>{fmt.format(new Date(a.createdAt))}</span>
        </div>

        <h2 className={s.cardTitle}>{a.title}</h2>

        <ExcerptBlock text={a.excerpt} />

        <div className={s.cardFooter}>
          <button
            className={s.readBtn}
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(a.id)
            }}
          >
            Lire l'article <IconArrow />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

/* ── Main Page ── */
export default function PublicArticlesPage({ router }: PublicArticlesPageProps) {
  const nextRouter = useRouter()
  const nav = router ?? nextRouter
  const { dark } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debSearch, setDebSearch] = useState('')
  const [selCat, setSelCat] = useState('')
  const [sort, setSort] = useState<SortKey>('date-desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const reqId = useRef(0)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  const isDark = mounted ? dark : false
  const { prog, top } = useScroll()

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    []
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }

    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const fetchCats = useCallback(async () => {
    setCatsLoading(true)
    try {
      const r = await api.get('/api/categories')
      setCategories(r.data ?? [])
    } catch {
      setCategories([])
    } finally {
      setCatsLoading(false)
    }
  }, [])

  const fetchArticles = useCallback(async (p: number, kw: string, cat: string, sortKey: SortKey) => {
    setLoading(true)
    setError(null)
    const id = ++reqId.current

    try {
      const q = new URLSearchParams({ page: String(p), limit: '9', sort: sortKey })
      if (kw.trim()) q.set('search', kw.trim())
      if (cat) q.set('category', cat)

      const r = await api.get<ArticlesResponse>(`/api/articles/public?${q}`)
      if (id !== reqId.current) return

      setArticles(r.data.data ?? [])
      setTotalPages(r.data.pagination?.totalPages ?? 1)
      setTotalItems(r.data.pagination?.total ?? r.data.data?.length ?? 0)
    } catch {
      if (id !== reqId.current) return
      setError('Impossible de charger les articles.')
      setArticles([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCats()
  }, [fetchCats])

  useEffect(() => {
    fetchArticles(page, debSearch, selCat, sort)
  }, [page, debSearch, selCat, sort, fetchArticles])

  const goPage = (n: number) => {
    if (n < 1 || n > totalPages || n === page || loading) return
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSearch = (v: string) => {
    setSearch(v)
    if (page !== 1) setPage(1)
  }

  const onCat = (v: string) => {
    setSelCat(v === selCat ? '' : v)
    if (page !== 1) setPage(1)
  }

  const onSort = (v: SortKey) => {
    setSort(v)
    setSortOpen(false)
    if (page !== 1) setPage(1)
  }

  const clear = () => {
    setSearch('')
    setDebSearch('')
    setSelCat('')
    setPage(1)
    setSort('date-desc')
    searchRef.current?.focus()
  }

  const hasFilters = search.trim() !== '' || selCat !== ''
  const activeCat = categories.find((c) => c.slug === selCat)
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? 'Trier'

  const pages = useMemo(() => {
    const ps: (number | '…')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) ps.push(i)
    } else {
      ps.push(1)
      if (page > 3) ps.push('…')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) ps.push(i)
      if (page < totalPages - 2) ps.push('…')
      ps.push(totalPages)
    }

    return ps
  }, [page, totalPages])

  return (
    <div className={s.page} data-theme={isDark ? 'dark' : 'light'} suppressHydrationWarning>
      <div className={s.progress}>
        <div className={s.progressFill} style={{ width: `${prog}%` }} />
      </div>

      <div className={s.wrap}>
        <header className={s.hero}>
          <div className={s.heroLeft}>
            <div className={s.eyebrow}>
              <span className={s.eyebrowDot} />
              Actualités &amp; Publications
            </div>

            <h1 className={s.heroTitle}>
              Nos dernières
              <br />
              <em>Actualités</em>
            </h1>

            <p className={s.heroSub}>
              Découvrez nos publications, nouveautés et informations sur nos activités
              et projets. Restez au fait des dernières tendances IT.
            </p>
          </div>

          <div className={s.heroStats}>
            <div className={s.heroStat}>
              <div className={s.heroStatNum}>{!loading ? totalItems : '—'}</div>
              <div className={s.heroStatLabel}>articles</div>
            </div>

            <div className={s.heroStat}>
              <div className={s.heroStatNum}>{categories.length || '—'}</div>
              <div className={s.heroStatLabel}>catégories</div>
            </div>
          </div>
        </header>

        <div className={s.sticky}>
          <div className={s.stickyBar}>
            <div className={s.searchField}>
              <IconSearch />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Rechercher…"
                className={s.searchInput}
              />

              {search && (
                <button className={s.iconBtn} onClick={() => onSearch('')} aria-label="Effacer">
                  <IconX />
                </button>
              )}
            </div>

            <div className={s.stickyRight}>
              <div className={s.dropdown} ref={filterRef}>
                <button
                  className={`${s.dropBtn} ${filterOpen || selCat ? s.dropBtnActive : ''}`}
                  onClick={() => {
                    setFilterOpen((v) => !v)
                    setSortOpen(false)
                  }}
                >
                  <IconFilter />
                  <span>Filtrer</span>
                  {selCat && <span className={s.dropBadge}>1</span>}
                  <IconChevron open={filterOpen} />
                </button>

                <div className={`${s.dropPanel} ${filterOpen ? s.dropPanelOpen : ''}`}>
                  <div className={s.dropPanelInner}>
                    <div className={s.dropLabel}>Catégories</div>

                    <div className={s.catList}>
                      <button
                        className={`${s.catPill} ${!selCat ? s.catPillActive : ''}`}
                        onClick={() => {
                          onCat('')
                          setFilterOpen(false)
                        }}
                      >
                        Toutes
                      </button>

                      {!catsLoading &&
                        categories.map((c) => (
                          <button
                            key={c.id}
                            className={`${s.catPill} ${selCat === (c.slug ?? '') ? s.catPillActive : ''}`}
                            onClick={() => {
                              onCat(c.slug ?? '')
                              setFilterOpen(false)
                            }}
                          >
                            {c.name}
                          </button>
                        ))}

                      {catsLoading &&
                        Array.from({ length: 4 }).map((_, i) => <span key={i} className={s.catSk} />)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.dropdown} ref={sortRef}>
                <button
                  className={`${s.dropBtn} ${sortOpen || sort !== 'date-desc' ? s.dropBtnActive : ''}`}
                  onClick={() => {
                    setSortOpen((v) => !v)
                    setFilterOpen(false)
                  }}
                >
                  <IconSort />
                  <span>{activeSortLabel}</span>
                  <IconChevron open={sortOpen} />
                </button>

                <div className={`${s.dropPanel} ${s.dropPanelRight} ${sortOpen ? s.dropPanelOpen : ''}`}>
                  <div className={s.dropPanelInner}>
                    <div className={s.dropLabel}>Trier par</div>

                    {SORT_OPTIONS.map((o) => (
                      <button
                        key={o.key}
                        className={`${s.sortOpt} ${sort === o.key ? s.sortOptActive : ''}`}
                        onClick={() => onSort(o.key)}
                      >
                        {o.label}
                        {sort === o.key && <span className={s.sortCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button className={s.clearBtn} onClick={clear}>
                  Tout effacer
                </button>
              )}
            </div>
          </div>

          {hasFilters && (
            <div className={s.chips}>
              {activeCat && (
                <span className={s.chip}>
                  {activeCat.name}
                  <button onClick={() => onCat('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {search.trim() && (
                <span className={s.chip}>
                  "{search.trim()}"
                  <button onClick={() => onSearch('')}>
                    <IconX />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className={s.resultsMeta}>
            <span className={s.resultsCount}>
              {!loading ? `${totalItems} résultat${totalItems > 1 ? 's' : ''}` : 'Chargement…'}
            </span>

            {totalPages > 1 && !loading && (
              <span className={s.pagePill}>
                Page {page} / {totalPages}
              </span>
            )}
          </div>
        </div>

        {error && <div className={s.error}>{error}</div>}

        {loading ? (
          <div className={s.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={s.skCard}>
                <div className={`${s.sk} ${s.skImg}`} />
                <div className={s.skBody}>
                  <div className={`${s.sk} ${s.skChip}`} />
                  <div className={`${s.sk} ${s.skTitle}`} />
                  <div className={`${s.sk} ${s.skLine}`} />
                  <div className={`${s.sk} ${s.skLine} ${s.skShort}`} />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <IconSearch />
            </div>
            <h2>Aucune actualité trouvée</h2>
            <p>Essayez un autre mot-clé ou réinitialisez les filtres.</p>
            {hasFilters && (
              <button className={s.resetBtn} onClick={clear}>
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {articles.map((a, i) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  index={i}
                  fmt={fmt}
                  onNavigate={(id) => nav.push(`/articles/${id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={s.pagination}>
                <button className={s.pBtn} onClick={() => goPage(page - 1)} disabled={page <= 1 || loading}>
                  ‹
                </button>

                {pages.map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className={s.pEll}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`${s.pBtn} ${p === page ? s.pActive : ''}`}
                      onClick={() => goPage(p as number)}
                      disabled={p === page || loading}
                    >
                      {p}
                    </button>
                  )
                )}

                <button className={s.pBtn} onClick={() => goPage(page + 1)} disabled={page >= totalPages || loading}>
                  ›
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      <button
        className={`${s.scrollTop} ${top ? s.scrollTopShow : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Retour en haut"
      >
        <IconUp />
      </button>
    </div>
  )
}