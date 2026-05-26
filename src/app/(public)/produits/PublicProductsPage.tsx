'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import { translateDynamicItems } from '@/app/i18n/dynamic'
import { type Locale, normalizeLocale } from '@/app/i18n/settings'
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

function formatPrice(value: Product['price'], locale: Locale) {
  if (value === null || value === undefined || value === '') {
    return locale === 'en' ? 'On request' : 'Sur devis'
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return String(value)
  }

  return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(
    numeric,
  )} Ar`
}

function getProductIdentifier(product: Product) {
  return product.slug || product.id
}

function getProductDetailHref(product: Product) {
  return `/produits/${getProductIdentifier(product)}`
}

function getProductLeadHref(product: Product) {
  return `/produits/${getProductIdentifier(product)}/lead`
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7.5" />
    <path d="M22 22l-4.35-4.35" />
  </svg>
)

const IconX = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconArrow = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const IconUp = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const IconFilter = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
)

const IconSort = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18M7 12h10M11 18h2" />
  </svg>
)

const IconCal = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'date-desc', labelKey: 'productsPage.sort.dateDesc' },
  { key: 'date-asc', labelKey: 'productsPage.sort.dateAsc' },
  { key: 'price-asc', labelKey: 'productsPage.sort.priceAsc' },
  { key: 'price-desc', labelKey: 'productsPage.sort.priceDesc' },
  { key: 'name-asc', labelKey: 'productsPage.sort.nameAsc' },
  { key: 'name-desc', labelKey: 'productsPage.sort.nameDesc' },
]

// ─── ExcerptBlock ────────────────────────────────────────────────────────────

function ExcerptBlock({ text }: { text: string | null }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const raw = text?.trim() || t('productsPage.card.noDescription')
  const isLong = raw.length > EXCERPT_LIMIT

  return (
    <div className={s.excerptWrap}>
      <p className={`${s.cardExcerpt} ${expanded ? s.cardExcerptFull : ''}`}>
        {!isLong || expanded ? raw : raw.slice(0, EXCERPT_LIMIT) + '…'}
      </p>

      {isLong && (
        <button
          type="button"
          className={s.excerptToggle}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          <span>
            {expanded
              ? t('productsPage.card.collapse')
              : t('productsPage.card.readMore')}
          </span>

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
  const { t, i18n } = useTranslation()
  const cardRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const detailHref = getProductDetailHref(product)
  const leadHref = getProductLeadHref(product)
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language)

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

  const initial = (product.category?.name ?? product.name ?? 'P')
    .charAt(0)
    .toUpperCase()

  const publishedValue = product.publishedAt || product.createdAt
  const publishedLabel = publishedValue
    ? fmt.format(new Date(publishedValue))
    : null

  const categoryLabel = product.category?.name || t('productsPage.card.catalog')

  return (
    <motion.article
      ref={cardRef}
      className={s.card}
      role="link"
      tabIndex={0}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onNavigate(detailHref)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onNavigate(detailHref)
      }}
      aria-label={`${t('productsPage.card.viewSheet')} : ${product.name}`}
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
            <span className={s.cardEyebrow}>
              {t('productsPage.card.eyebrow')}
            </span>

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
                <span className={s.detailLabel}>
                  {t('productsPage.card.category')}
                </span>
                <span className={s.detailValue}>{categoryLabel}</span>
              </div>

              {publishedLabel && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>
                    {t('productsPage.card.updated')}
                  </span>
                  <span className={s.detailValue}>{publishedLabel}</span>
                </div>
              )}
            </div>

            <div className={s.pricePanel}>
              <span className={s.priceLabel}>
                {t('productsPage.card.price')}
              </span>
              <span className={s.cardPrice}>
                {formatPrice(product.price, locale)}
              </span>
            </div>
          </div>

          <div className={s.cardActionRow}>
            <span className={s.cardCategoryInline}>
              {product.category?.name
                ? `${product.category.name} · ${t('productsPage.card.productSheet')}`
                : t('productsPage.card.productSheet')}
            </span>

            <div className={s.cardButtons}>
              <button
                type="button"
                className={s.secondaryBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(detailHref)
                }}
              >
                {t('productsPage.card.viewSheet')}
              </button>

              <button
                type="button"
                className={s.leadBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(leadHref)
                }}
              >
                {t('productsPage.card.requestDemo')}
                <IconArrow />
              </button>
            </div>
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
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language)

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
  const autoCloseRef = useRef<number | null>(null)

  const isDark = mounted ? dark : false
  const { prog, top } = useScroll()

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebSearch(search), 350)

    return () => clearTimeout(timer)
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
      const response = await api.get('/api/product-categories')
      const nextCategories = await translateDynamicItems<Category>(
        response.data.data ?? [],
        locale,
        ['name'],
      )

      setCategories(nextCategories)
    } catch {
      setCategories([])
    } finally {
      setCatsLoading(false)
    }
  }, [locale])

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
        const q = new URLSearchParams({
          page: String(nextPage),
          limit: '9',
          sort: nextSort,
        })

        if (kw.trim()) q.set('search', kw.trim())
        if (categoryId) q.set('category', categoryId)
        if (nextMinPrice.trim()) q.set('minPrice', nextMinPrice.trim())
        if (nextMaxPrice.trim()) q.set('maxPrice', nextMaxPrice.trim())
        if (nextImageMode === 'with-image') q.set('hasImage', 'true')
        if (nextImageMode === 'without-image') q.set('hasImage', 'false')

        const response = await api.get<ProductsResponse>(
          `/api/products/public?${q.toString()}`,
        )

        if (id !== reqId.current) return

        const nextProducts = await translateDynamicItems<Product>(
          response.data.data ?? [],
          locale,
          ['name', 'excerpt', 'category.name'],
        )

        if (id !== reqId.current) return

        setProducts(nextProducts)
        setTotalPages(response.data.pagination?.totalPages ?? 1)
        setTotalItems(
          response.data.pagination?.total ?? response.data.data?.length ?? 0,
        )
      } catch {
        if (id !== reqId.current) return

        setError(t('productsPage.errors.load'))
        setProducts([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        if (id === reqId.current) {
          setLoading(false)
        }
      }
    },
    [locale, t],
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

    if (page !== 1) {
      setPage(1)
    }
  }

  const onCat = (value: string) => {
    setSelCat(value === selCat ? '' : value)

    if (page !== 1) {
      setPage(1)
    }
  }

  const onSort = (value: SortKey) => {
    setSort(value)
    setSortOpen(false)
    clearAutoClose()

    if (page !== 1) {
      setPage(1)
    }
  }

  const onImageMode = (value: ImageMode) => {
    setImageMode(value)

    if (page !== 1) {
      setPage(1)
    }
  }

  const onMinPrice = (value: string) => {
    setMinPrice(value.replace(/[^\d]/g, ''))

    if (page !== 1) {
      setPage(1)
    }
  }

  const onMaxPrice = (value: string) => {
    setMaxPrice(value.replace(/[^\d]/g, ''))

    if (page !== 1) {
      setPage(1)
    }
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
      for (let i = 1; i <= totalPages; i++) {
        ps.push(i)
      }

      return ps
    }

    ps.push(1)

    if (page > 3) {
      ps.push('…')
    }

    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      ps.push(i)
    }

    if (page < totalPages - 2) {
      ps.push('…')
    }

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
              {t('productsPage.heroEyebrow')}
            </div>

            <h1 className={s.heroTitle}>
              {t('productsPage.titlePrefix')}{' '}
              <em>{t('productsPage.titleEmphasis')}</em>
            </h1>

            <p className={s.heroSub}>
              {t('productsPage.subtitle')}
            </p>
          </div>

          <div className={s.heroStats}>
            <div className={s.heroStat}>
              <div className={s.heroStatNum}>{!loading ? totalItems : '—'}</div>
              <div className={s.heroStatLabel}>
                {t('productsPage.statsProducts')}
              </div>
            </div>

            <div className={s.heroStat}>
              <div className={s.heroStatNum}>{categories.length || '—'}</div>
              <div className={s.heroStatLabel}>
                {t('productsPage.statsCategories')}
              </div>
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
                placeholder={t('productsPage.searchPlaceholder')}
                className={s.searchInput}
              />

              {search && (
                <button
                  type="button"
                  className={s.iconBtn}
                  onClick={() => onSearch('')}
                  aria-label={t('common.clear')}
                >
                  <IconX />
                </button>
              )}
            </div>

            <div className={s.stickyRight}>
              <div className={s.dropdown} ref={filterRef}>
                <button
                  type="button"
                  className={`${s.dropBtn} ${
                    filterOpen || activeFilterCount ? s.dropBtnActive : ''
                  }`}
                  aria-expanded={filterOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    const next = !filterOpen

                    setFilterOpen(next)
                    setSortOpen(false)
                    clearAutoClose()

                    if (next) {
                      startAutoClose('filter')
                    }
                  }}
                >
                  <IconFilter />
                  <span>
                    {filterOpen
                      ? t('productsPage.filtersClose')
                      : t('productsPage.filtersOpen')}
                  </span>

                  {activeFilterCount > 0 && (
                    <span className={s.dropBadge}>{activeFilterCount}</span>
                  )}

                  <IconChevron open={filterOpen} />
                </button>

                <div
                  className={`${s.dropPanel} ${
                    filterOpen ? s.dropPanelOpen : ''
                  }`}
                  onMouseEnter={clearAutoClose}
                  onMouseLeave={() => filterOpen && startAutoClose('filter')}
                >
                  <div className={s.dropPanelInner}>
                    <div className={s.dropPanelHeader}>
                      <div>
                        <div className={s.dropPanelTitle}>
                          {t('productsPage.filtersTitle')}
                        </div>
                        <div className={s.dropPanelHint}>
                          {t('productsPage.panelAutoClose')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={s.dropCloseBtn}
                        onClick={() => {
                          setFilterOpen(false)
                          clearAutoClose()
                        }}
                        aria-label={t('productsPage.closeFilters')}
                      >
                        <IconX />
                      </button>
                    </div>

                    <div className={s.dropLabel}>
                      {t('productsPage.categories')}
                    </div>

                    <div className={s.catList}>
                      <button
                        type="button"
                        className={`${s.catPill} ${
                          !selCat ? s.catPillActive : ''
                        }`}
                        onClick={() => onCat('')}
                      >
                        {t('productsPage.allCategories')}
                      </button>

                      {!catsLoading &&
                        categories.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            className={`${s.catPill} ${
                              selCat === c.id ? s.catPillActive : ''
                            }`}
                            onClick={() => onCat(c.id)}
                          >
                            {c.name}
                          </button>
                        ))}

                      {catsLoading &&
                        Array.from({ length: 4 }).map((_, i) => (
                          <span key={i} className={s.catSk} />
                        ))}
                    </div>

                    <div className={s.dropLabel} style={{ marginTop: 16 }}>
                      {t('productsPage.price')}
                    </div>

                    <div className={s.fieldGrid}>
                      <div className={s.field}>
                        <label className={s.fieldLabel} htmlFor="min-price">
                          {t('productsPage.minPrice')}
                        </label>

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
                        <label className={s.fieldLabel} htmlFor="max-price">
                          {t('productsPage.maxPrice')}
                        </label>

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

                    <div className={s.dropLabel} style={{ marginTop: 16 }}>
                      {t('productsPage.visual')}
                    </div>

                    <div className={s.switchRow}>
                      <button
                        type="button"
                        className={`${s.switchBtn} ${
                          imageMode === 'all' ? s.switchBtnActive : ''
                        }`}
                        onClick={() => onImageMode('all')}
                      >
                        {t('productsPage.allImages')}
                      </button>

                      <button
                        type="button"
                        className={`${s.switchBtn} ${
                          imageMode === 'with-image' ? s.switchBtnActive : ''
                        }`}
                        onClick={() => onImageMode('with-image')}
                      >
                        {t('productsPage.withImage')}
                      </button>

                      <button
                        type="button"
                        className={`${s.switchBtn} ${
                          imageMode === 'without-image'
                            ? s.switchBtnActive
                            : ''
                        }`}
                        onClick={() => onImageMode('without-image')}
                      >
                        {t('productsPage.withoutImage')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.dropdown} ref={sortRef}>
                <button
                  type="button"
                  className={`${s.dropBtn} ${
                    sortOpen || sort !== 'date-desc' ? s.dropBtnActive : ''
                  }`}
                  aria-expanded={sortOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    const next = !sortOpen

                    setSortOpen(next)
                    setFilterOpen(false)
                    clearAutoClose()

                    if (next) {
                      startAutoClose('sort')
                    }
                  }}
                >
                  <IconSort />
                  <span>
                    {sortOpen
                      ? t('productsPage.sortClose')
                      : t('productsPage.sortOpen')}
                  </span>
                  <IconChevron open={sortOpen} />
                </button>

                <div
                  className={`${s.dropPanel} ${s.dropPanelRight} ${
                    sortOpen ? s.dropPanelOpen : ''
                  }`}
                  onMouseEnter={clearAutoClose}
                  onMouseLeave={() => sortOpen && startAutoClose('sort')}
                >
                  <div className={s.dropPanelInner}>
                    <div className={s.dropPanelHeader}>
                      <div>
                        <div className={s.dropPanelTitle}>
                          {t('productsPage.sortTitle')}
                        </div>
                        <div className={s.dropPanelHint}>
                          {t('productsPage.panelAutoClose')}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={s.dropCloseBtn}
                        onClick={() => {
                          setSortOpen(false)
                          clearAutoClose()
                        }}
                        aria-label={t('productsPage.closeSort')}
                      >
                        <IconX />
                      </button>
                    </div>

                    <div className={s.dropLabel}>
                      {t('productsPage.sortBy')}
                    </div>

                    {SORT_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        className={`${s.sortOpt} ${
                          sort === option.key ? s.sortOptActive : ''
                        }`}
                        onClick={() => onSort(option.key)}
                      >
                        {t(option.labelKey)}

                        {sort === option.key && (
                          <span className={s.sortCheck}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button type="button" className={s.clearBtn} onClick={clear}>
                  {t('common.clearAll')}
                </button>
              )}
            </div>
          </div>

          {hasFilters && (
            <div className={s.chips}>
              {activeCat && (
                <span className={s.chip}>
                  {activeCat.name}

                  <button type="button" onClick={() => onCat('')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}

              {search.trim() && (
                <span className={s.chip}>
                  &quot;{search.trim()}&quot;

                  <button type="button" onClick={() => onSearch('')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}

              {minPrice.trim() && (
                <span className={s.chip}>
                  Min {formatPrice(minPrice, locale)}

                  <button type="button" onClick={() => onMinPrice('')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}

              {maxPrice.trim() && (
                <span className={s.chip}>
                  Max {formatPrice(maxPrice, locale)}

                  <button type="button" onClick={() => onMaxPrice('')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}

              {imageMode === 'with-image' && (
                <span className={s.chip}>
                  {t('productsPage.withImage')}

                  <button type="button" onClick={() => onImageMode('all')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}

              {imageMode === 'without-image' && (
                <span className={s.chip}>
                  {t('productsPage.withoutImage')}

                  <button type="button" onClick={() => onImageMode('all')} aria-label={t('common.clear')}>
                    <IconX />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className={s.resultsMeta}>
            <span className={s.resultsCount}>
              {!loading
                ? t('productsPage.resultCount', { count: totalItems })
                : t('common.loading')}
            </span>

            {totalPages > 1 && !loading && (
              <span className={s.pagePill}>
                {t('common.page', { page, total: totalPages })}
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
        ) : products.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <IconSearch />
            </div>

            <h2>{t('productsPage.emptyTitle')}</h2>

            <p>{t('productsPage.emptyText')}</p>

            {hasFilters && (
              <button type="button" className={s.resetBtn} onClick={clear}>
                {t('common.resetFilters')}
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
                  type="button"
                  className={s.pBtn}
                  onClick={() => goPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  ‹
                </button>

                {pages.map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className={s.pEll}>
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
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
                  type="button"
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
        type="button"
        className={`${s.scrollTop} ${top ? s.scrollTopShow : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={t('common.scrollTop')}
      >
        <IconUp />
      </button>
    </div>
  )
}
