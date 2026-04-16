'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import s from './PublicProductsPage.module.css'

interface Category {
  id: string
  name: string
  slug?: string | null
}

interface Product {
  id: string
  name: string
  slug?: string | null
  excerpt: string | null
  price: number | string | null
  coverImage?: string | null
  publishedAt?: string | null
  createdAt?: string | null
  category?: Category | null
}

interface ProductsResponse {
  data: Product[]
  pagination: {
    page?: number
    limit?: number
    total?: number
    totalPages: number
  }
}

interface PublicProductsPageProps {
  router?: {
    push: (href: string) => void
  }
}

type SortKey =
  | 'date-desc'
  | 'date-asc'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'

type ImageMode = 'all' | 'with-image' | 'without-image'

const EXCERPT_LIMIT = 90

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

function formatPrice(value: Product['price']) {
  if (value === null || value === undefined || value === '') return 'Sur devis'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return `${new Intl.NumberFormat('fr-FR').format(numeric)} Ar`
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7.5" />
    <path d="M22 22l-4.35-4.35" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  { key: 'price-asc', label: 'Prix croissant' },
  { key: 'price-desc', label: 'Prix décroissant' },
  { key: 'name-asc', label: 'Nom A → Z' },
  { key: 'name-desc', label: 'Nom Z → A' },
]

// ─── ExcerptBlock ────────────────────────────────────────────────────────────
function ExcerptBlock({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const raw = text?.trim() || 'Aucune description disponible.'
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
          <span>{expanded ? 'Réduire' : 'Lire plus'}</span>
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

// ─── ProductCard ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  fmt,
  onNavigate,
}: {
  product: Product
  index: number
  fmt: Intl.DateTimeFormat
  onNavigate: (href: string) => void
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

  const href = `/produits/${product.slug || product.id}`
  const initial = (product.category?.name ?? product.name ?? 'P').charAt(0).toUpperCase()
  const publishedValue = product.publishedAt || product.createdAt
  const publishedLabel = publishedValue ? fmt.format(new Date(publishedValue)) : null
  const categoryLabel = product.category?.name || 'Catalogue'

  return (
    <motion.article
      ref={cardRef}
      className={s.card}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onNavigate(href)}
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
        {product.coverImage ? (
          <img
            src={product.coverImage}
            alt={product.name}
            className={s.img}
            loading="lazy"
          />
        ) : (
          <div className={s.placeholder}>
            <span>{initial}</span>
          </div>
        )}

        <div className={s.imgGloss} />

        {product.category?.name && (
          <div className={s.badgeCat}>{product.category.name}</div>
        )}
      </div>

      <div className={s.body}>
        <div className={s.cardHeader}>
          <div className={s.cardTopRow}>
            <span className={s.cardEyebrow}>Solution premium</span>
            {publishedLabel && (
              <div className={s.dateLine}>
                <IconCal />
                <span>{publishedLabel}</span>
              </div>
            )}
          </div>

          <h2 className={s.cardTitle}>{product.name}</h2>
        </div>

        <ExcerptBlock text={product.excerpt} />

        <div className={s.cardFooter}>
          <div className={s.cardMetaRow}>
            <div className={s.cardDetails}>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Catégorie</span>
                <span className={s.detailValue}>{categoryLabel}</span>
              </div>

              {publishedLabel && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>Mis à jour</span>
                  <span className={s.detailValue}>{publishedLabel}</span>
                </div>
              )}
            </div>

            <div className={s.pricePanel}>
              <span className={s.priceLabel}>Tarif</span>
              <span className={s.cardPrice}>{formatPrice(product.price)}</span>
            </div>
          </div>

          <div className={s.cardActionRow}>
            <span className={s.cardCategoryInline}>
              {product.category?.name
                ? `${product.category.name} · Fiche produit`
                : 'Fiche produit'}
            </span>

            <button
              className={s.readBtn}
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(href)
              }}
            >
              Voir la solution <IconArrow />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PublicProductsPage({ router }: PublicProductsPageProps) {
  const nextRouter = useRouter()
  const nav = router ?? nextRouter
  const { dark } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debSearch, setDebSearch] = useState('')
  const [selCat, setSelCat] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [imageMode, setImageMode] = useState<ImageMode>('all')
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
  const autoCloseRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const isDark = mounted ? dark : false
  const { prog, top } = useScroll()

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const clearAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      window.clearTimeout(autoCloseRef.current)
      autoCloseRef.current = null
    }
  }, [])

  const startAutoClose = useCallback(
    (panel: 'filter' | 'sort') => {
      clearAutoClose()

      autoCloseRef.current = window.setTimeout(() => {
        if (panel === 'filter') setFilterOpen(false)
        if (panel === 'sort') setSortOpen(false)
      }, 6000)
    },
    [clearAutoClose],
  )

  useEffect(() => {
    return () => clearAutoClose()
  }, [clearAutoClose])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
        clearAutoClose()
      }

      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
        clearAutoClose()
      }
    }

    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [clearAutoClose])

  const fetchCats = useCallback(async () => {
    setCatsLoading(true)
    try {
      const r = await api.get('/api/product-categories')
      setCategories(r.data.data)
    } catch {
      setCategories([])
    } finally {
      setCatsLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(
    async (
      nextPage: number,
      kw: string,
      categoryId: string,
      nextSort: SortKey,
      nextMinPrice: string,
      nextMaxPrice: string,
      nextImageMode: ImageMode,
    ) => {
      setLoading(true)
      setError(null)
      const id = ++reqId.current

      try {
        const q = new URLSearchParams({ page: String(nextPage), limit: '9', sort: nextSort })
        if (kw.trim()) q.set('search', kw.trim())
        if (categoryId) q.set('category', categoryId)
        if (nextMinPrice.trim()) q.set('minPrice', nextMinPrice.trim())
        if (nextMaxPrice.trim()) q.set('maxPrice', nextMaxPrice.trim())
        if (nextImageMode === 'with-image') q.set('hasImage', 'true')
        if (nextImageMode === 'without-image') q.set('hasImage', 'false')

        const r = await api.get<ProductsResponse>(`/api/products/public?${q.toString()}`)

        if (id !== reqId.current) return

        setProducts(r.data.data ?? [])
        setTotalPages(r.data.pagination?.totalPages ?? 1)
        setTotalItems(r.data.pagination?.total ?? r.data.data?.length ?? 0)
      } catch {
        if (id !== reqId.current) return
        setError('Impossible de charger les produits.')
        setProducts([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchCats()
  }, [fetchCats])

  useEffect(() => {
    fetchProducts(page, debSearch, selCat, sort, minPrice, maxPrice, imageMode)
  }, [page, debSearch, selCat, sort, minPrice, maxPrice, imageMode, fetchProducts])

  const goPage = (n: number) => {
    if (n < 1 || n > totalPages || n === page || loading) return
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSearch = (value: string) => {
    setSearch(value)
    if (page !== 1) setPage(1)
  }

  const onCat = (value: string) => {
    setSelCat(value === selCat ? '' : value)
    if (page !== 1) setPage(1)
  }

  const onSort = (value: SortKey) => {
    setSort(value)
    setSortOpen(false)
    clearAutoClose()
    if (page !== 1) setPage(1)
  }

  const onImageMode = (value: ImageMode) => {
    setImageMode(value)
    if (page !== 1) setPage(1)
  }

  const onMinPrice = (value: string) => {
    setMinPrice(value.replace(/[^\d]/g, ''))
    if (page !== 1) setPage(1)
  }

  const onMaxPrice = (value: string) => {
    setMaxPrice(value.replace(/[^\d]/g, ''))
    if (page !== 1) setPage(1)
  }

  const clear = () => {
    setSearch('')
    setDebSearch('')
    setSelCat('')
    setMinPrice('')
    setMaxPrice('')
    setImageMode('all')
    setSort('date-desc')
    setFilterOpen(false)
    setSortOpen(false)
    clearAutoClose()
    setPage(1)
    searchRef.current?.focus()
  }

  const activeCat = categories.find((c) => c.id === selCat)

  const activeFilterCount =
    (selCat ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (imageMode !== 'all' ? 1 : 0)

  const hasFilters =
    search.trim() !== '' ||
    selCat !== '' ||
    minPrice.trim() !== '' ||
    maxPrice.trim() !== '' ||
    imageMode !== 'all'

  const pages = useMemo(() => {
    const ps: (number | '…')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) ps.push(i)
      return ps
    }

    ps.push(1)
    if (page > 3) ps.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) ps.push(i)
    if (page < totalPages - 2) ps.push('…')
    ps.push(totalPages)

    return ps
  }, [page, totalPages])

  return (
    <div
      className={s.page}
      data-theme={isDark ? 'dark' : 'light'}
      suppressHydrationWarning
    >
      <div className={s.progress}>
        <div className={s.progressFill} style={{ width: `${prog}%` }} />
      </div>

      <div className={s.wrap}>
        <header className={s.hero}>
          <div className={s.heroLeft}>
            <div className={s.eyebrow}>
              <span className={s.eyebrowDot} />
              Catalogue produits
            </div>

            <h1 className={s.heroTitle}>
              Nos <em>Solutions</em>
            </h1>

            <p className={s.heroSub}>
              Logiciels, modules et outils métier conçus pour des équipes exigeantes.
              Explorez notre catalogue, comparez les tarifs et accédez aux fiches produits détaillées.
            </p>
          </div>

          <div className={s.heroStats}>
            <div className={s.heroStat}>
              <div className={s.heroStatNum}>{!loading ? totalItems : '—'}</div>
              <div className={s.heroStatLabel}>produits</div>
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
                placeholder="Rechercher une solution…"
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
                  className={`${s.dropBtn} ${filterOpen || activeFilterCount ? s.dropBtnActive : ''}`}
                  onClick={() => {
                    const next = !filterOpen
                    setFilterOpen(next)
                    setSortOpen(false)
                    clearAutoClose()
                    if (next) startAutoClose('filter')
                  }}
                >
                  <IconFilter />
                  <span>{filterOpen ? 'Fermer filtres' : 'Afficher filtres'}</span>
                  {activeFilterCount > 0 && <span className={s.dropBadge}>{activeFilterCount}</span>}
                  <IconChevron open={filterOpen} />
                </button>

                <div
                  className={`${s.dropPanel} ${filterOpen ? s.dropPanelOpen : ''}`}
                  onMouseEnter={clearAutoClose}
                  onMouseLeave={() => filterOpen && startAutoClose('filter')}
                >
                  <div className={s.dropPanelInner}>
                    <div className={s.dropPanelHeader}>
                      <div>
                        <div className={s.dropPanelTitle}>Filtres</div>
                        <div className={s.dropPanelHint}>Fermeture automatique après 6 secondes</div>
                      </div>

                      <button
                        type="button"
                        className={s.dropCloseBtn}
                        onClick={() => {
                          setFilterOpen(false)
                          clearAutoClose()
                        }}
                        aria-label="Fermer les filtres"
                      >
                        <IconX />
                      </button>
                    </div>

                    <div className={s.dropLabel}>Catégories</div>
                    <div className={s.catList}>
                      <button
                        className={`${s.catPill} ${!selCat ? s.catPillActive : ''}`}
                        onClick={() => onCat('')}
                      >
                        Toutes
                      </button>

                      {!catsLoading &&
                        categories.map((c) => (
                          <button
                            key={c.id}
                            className={`${s.catPill} ${selCat === c.id ? s.catPillActive : ''}`}
                            onClick={() => onCat(c.id)}
                          >
                            {c.name}
                          </button>
                        ))}

                      {catsLoading &&
                        Array.from({ length: 4 }).map((_, i) => <span key={i} className={s.catSk} />)}
                    </div>

                    <div className={s.dropLabel} style={{ marginTop: 16 }}>Prix</div>
                    <div className={s.fieldGrid}>
                      <div className={s.field}>
                        <label className={s.fieldLabel} htmlFor="min-price">Prix min</label>
                        <input
                          id="min-price"
                          className={s.fieldInput}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => onMinPrice(e.target.value)}
                        />
                      </div>

                      <div className={s.field}>
                        <label className={s.fieldLabel} htmlFor="max-price">Prix max</label>
                        <input
                          id="max-price"
                          className={s.fieldInput}
                          type="text"
                          inputMode="numeric"
                          placeholder="100 000"
                          value={maxPrice}
                          onChange={(e) => onMaxPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={s.dropLabel} style={{ marginTop: 16 }}>Visuel</div>
                    <div className={s.switchRow}>
                      <button
                        className={`${s.switchBtn} ${imageMode === 'all' ? s.switchBtnActive : ''}`}
                        onClick={() => onImageMode('all')}
                      >
                        Tous
                      </button>

                      <button
                        className={`${s.switchBtn} ${imageMode === 'with-image' ? s.switchBtnActive : ''}`}
                        onClick={() => onImageMode('with-image')}
                      >
                        Avec image
                      </button>

                      <button
                        className={`${s.switchBtn} ${imageMode === 'without-image' ? s.switchBtnActive : ''}`}
                        onClick={() => onImageMode('without-image')}
                      >
                        Sans image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.dropdown} ref={sortRef}>
                <button
                  className={`${s.dropBtn} ${sortOpen || sort !== 'date-desc' ? s.dropBtnActive : ''}`}
                  onClick={() => {
                    const next = !sortOpen
                    setSortOpen(next)
                    setFilterOpen(false)
                    clearAutoClose()
                    if (next) startAutoClose('sort')
                  }}
                >
                  <IconSort />
                  <span>{sortOpen ? 'Fermer tri' : 'Afficher tri'}</span>
                  <IconChevron open={sortOpen} />
                </button>

                <div
                  className={`${s.dropPanel} ${s.dropPanelRight} ${sortOpen ? s.dropPanelOpen : ''}`}
                  onMouseEnter={clearAutoClose}
                  onMouseLeave={() => sortOpen && startAutoClose('sort')}
                >
                  <div className={s.dropPanelInner}>
                    <div className={s.dropPanelHeader}>
                      <div>
                        <div className={s.dropPanelTitle}>Tri</div>
                        <div className={s.dropPanelHint}>Fermeture automatique après 6 secondes</div>
                      </div>

                      <button
                        type="button"
                        className={s.dropCloseBtn}
                        onClick={() => {
                          setSortOpen(false)
                          clearAutoClose()
                        }}
                        aria-label="Fermer le tri"
                      >
                        <IconX />
                      </button>
                    </div>

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

              {minPrice.trim() && (
                <span className={s.chip}>
                  Min {formatPrice(minPrice)}
                  <button onClick={() => onMinPrice('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {maxPrice.trim() && (
                <span className={s.chip}>
                  Max {formatPrice(maxPrice)}
                  <button onClick={() => onMaxPrice('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {imageMode === 'with-image' && (
                <span className={s.chip}>
                  Avec image
                  <button onClick={() => onImageMode('all')}>
                    <IconX />
                  </button>
                </span>
              )}

              {imageMode === 'without-image' && (
                <span className={s.chip}>
                  Sans image
                  <button onClick={() => onImageMode('all')}>
                    <IconX />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className={s.resultsMeta}>
            <span className={s.resultsCount}>
              {!loading
                ? `${totalItems} solution${totalItems > 1 ? 's' : ''} disponible${totalItems > 1 ? 's' : ''}`
                : 'Chargement…'}
            </span>

            {totalPages > 1 && !loading && (
              <span className={s.pagePill}>Page {page} / {totalPages}</span>
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
        ) : products.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}><IconSearch /></div>
            <h2>Aucune solution trouvée</h2>
            <p>Essayez un autre mot-clé ou réinitialisez les filtres actifs.</p>
            {hasFilters && (
              <button className={s.resetBtn} onClick={clear}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  fmt={fmt}
                  onNavigate={(href) => nav.push(href)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={s.pagination}>
                <button
                  className={s.pBtn}
                  onClick={() => goPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  ‹
                </button>

                {pages.map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className={s.pEll}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`${s.pBtn} ${p === page ? s.pActive : ''}`}
                      onClick={() => goPage(p as number)}
                      disabled={p === page || loading}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  className={s.pBtn}
                  onClick={() => goPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
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