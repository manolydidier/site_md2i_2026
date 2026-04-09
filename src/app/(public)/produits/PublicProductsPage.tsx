'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  slug: string
  excerpt: string | null
  price: number | null
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
  filters?: {
    categories?: Category[]
  }
}

interface PublicProductsPageProps {
  router?: { push: (href: string) => void }
}

type SortKey =
  | 'published-desc'
  | 'published-asc'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'

const EXCERPT_LIMIT = 132

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
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return { prog, top }
}

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
  { key: 'published-desc', label: 'Plus récent' },
  { key: 'published-asc', label: 'Plus ancien' },
  { key: 'price-asc', label: 'Prix croissant' },
  { key: 'price-desc', label: 'Prix décroissant' },
  { key: 'name-asc', label: 'Nom A → Z' },
  { key: 'name-desc', label: 'Nom Z → A' },
]

function formatPrice(value: number | null) {
  if (value == null) return 'Prix sur demande'
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} Ar`
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d.,]/g, '').replace(',', '.')
}

function ExcerptBlock({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const raw = text?.trim() || 'Aucun extrait disponible.'
  const isLong = raw.length > EXCERPT_LIMIT

  return (
    <div className={s.excerptWrap}>
      <p className={`${s.cardExcerpt} ${expanded ? s.cardExcerptFull : ''}`}>
        {!isLong || expanded ? raw : `${raw.slice(0, EXCERPT_LIMIT)}…`}
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

function ProductCard({
  product,
  index,
  fmt,
  onNavigate,
}: {
  product: Product
  index: number
  fmt: Intl.DateTimeFormat
  onNavigate: (slugOrId: string) => void
}) {
  const cardRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
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

  const initial = (product.category?.name ?? product.name ?? 'P').charAt(0).toUpperCase()
  const href = product.slug || product.id
  const displayDate = product.publishedAt || product.createdAt || null

  return (
    <article
      ref={cardRef}
      className={s.card}
      style={{ animationDelay: `${index * 65}ms` }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => onNavigate(href)}
    >
      <div className={s.gloss} />
      <div className={s.glow} ref={glowRef} />

      <div className={s.media}>
        {product.coverImage ? (
          <img src={product.coverImage} alt={product.name} className={s.img} loading="lazy" />
        ) : (
          <div className={s.placeholder}>
            <span>{initial}</span>
          </div>
        )}

        <div className={s.imgGloss} />

        {product.category?.name && <div className={s.badgeCat}>{product.category.name}</div>}
        {product.price !== null && <div className={s.badgePrice}>{formatPrice(product.price)}</div>}
      </div>

      <div className={s.body}>
        {displayDate && (
          <div className={s.dateLine}>
            <IconCal />
            <span>{fmt.format(new Date(displayDate))}</span>
          </div>
        )}

        <h2 className={s.cardTitle}>{product.name}</h2>

        <div className={s.productMetaRow}>
          <span className={s.productMetaTag}>
            {product.category?.name || 'Produit'}
          </span>
          <span className={s.productPrice}>{formatPrice(product.price)}</span>
        </div>

        <ExcerptBlock text={product.excerpt} />

        <div className={s.cardFooter}>
          <button
            className={s.readBtn}
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(href)
            }}
          >
            Voir le produit <IconArrow />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function PublicProductsPage({ router }: PublicProductsPageProps) {
  const nextRouter = useRouter()
  const nav = router ?? nextRouter
  const { dark } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debSearch, setDebSearch] = useState('')
  const [selCat, setSelCat] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [hasImage, setHasImage] = useState<boolean | null>(null)
  const [sort, setSort] = useState<SortKey>('published-desc')
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

  const fetchProducts = useCallback(
    async (
      currentPage: number,
      keyword: string,
      category: string,
      min: string,
      max: string,
      imageState: boolean | null,
      sortKey: SortKey
    ) => {
      setLoading(true)
      setError(null)
      const id = ++reqId.current

      try {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: '9',
          sort: sortKey,
        })

        if (keyword.trim()) query.set('search', keyword.trim())
        if (category) query.set('category', category)
        if (min.trim()) query.set('minPrice', min.trim())
        if (max.trim()) query.set('maxPrice', max.trim())
        if (imageState !== null) query.set('hasImage', String(imageState))

        const res = await api.get<ProductsResponse>(`/api/products/public?${query.toString()}`)

        if (id !== reqId.current) return

        setProducts(res.data.data ?? [])
        setCategories(res.data.filters?.categories ?? [])
        setTotalPages(res.data.pagination?.totalPages ?? 1)
        setTotalItems(res.data.pagination?.total ?? res.data.data?.length ?? 0)
      } catch (err) {
        if (id !== reqId.current) return
        console.error(err)
        setError('Impossible de charger les produits.')
        setProducts([])
        setTotalPages(1)
        setTotalItems(0)
      } finally {
        if (id === reqId.current) setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchProducts(page, debSearch, selCat, minPrice, maxPrice, hasImage, sort)
  }, [page, debSearch, selCat, minPrice, maxPrice, hasImage, sort, fetchProducts])

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
    if (page !== 1) setPage(1)
  }

  const onMinPrice = (value: string) => {
    setMinPrice(sanitizeNumericInput(value))
    if (page !== 1) setPage(1)
  }

  const onMaxPrice = (value: string) => {
    setMaxPrice(sanitizeNumericInput(value))
    if (page !== 1) setPage(1)
  }

  const onHasImage = (value: boolean | null) => {
    setHasImage(value === hasImage ? null : value)
    if (page !== 1) setPage(1)
  }

  const clearAll = () => {
    setSearch('')
    setDebSearch('')
    setSelCat('')
    setMinPrice('')
    setMaxPrice('')
    setHasImage(null)
    setSort('published-desc')
    setPage(1)
    searchRef.current?.focus()
  }

  const hasFilters =
    search.trim() !== '' ||
    selCat !== '' ||
    minPrice.trim() !== '' ||
    maxPrice.trim() !== '' ||
    hasImage !== null

  const activeCat = categories.find(
    (category) => category.slug === selCat || category.id === selCat || category.name === selCat
  )
  const activeSortLabel = SORT_OPTIONS.find((option) => option.key === sort)?.label ?? 'Trier'
  const categoriesLoading = loading && categories.length === 0

  const pages = useMemo(() => {
    const result: (number | '…')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i)
      return result
    }

    result.push(1)

    if (page > 3) result.push('…')

    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      result.push(i)
    }

    if (page < totalPages - 2) result.push('…')

    result.push(totalPages)

    return result
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
              Catalogue &amp; Solutions
            </div>

            <h1 className={s.heroTitle}>
              Nos <em>Produits</em><br />
              en vitrine
            </h1>

            <p className={s.heroSub}>
              Explorez notre sélection de produits publiés avec un rendu premium,
              une recherche fluide, des filtres avancés et une expérience publique
              cohérente avec l’univers visuel existant.
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
                placeholder="Rechercher un produit, un extrait, un slug…"
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
                  className={`${s.dropBtn} ${filterOpen || hasFilters ? s.dropBtnActive : ''}`}
                  onClick={() => {
                    setFilterOpen((v) => !v)
                    setSortOpen(false)
                  }}
                >
                  <IconFilter />
                  <span>Filtres</span>
                  {hasFilters && <span className={s.dropBadge}>•</span>}
                  <IconChevron open={filterOpen} />
                </button>

                <div className={`${s.dropPanel} ${filterOpen ? s.dropPanelOpen : ''}`}>
                  <div className={s.dropPanelInner}>
                    <div className={s.dropLabel}>Catégories</div>

                    <div className={s.catList}>
                      <button
                        className={`${s.catPill} ${!selCat ? s.catPillActive : ''}`}
                        onClick={() => onCat('')}
                      >
                        Toutes
                      </button>

                      {!categoriesLoading &&
                        categories.map((category) => {
                          const value = category.slug || category.id
                          const active =
                            selCat === category.slug ||
                            selCat === category.id ||
                            selCat === category.name

                          return (
                            <button
                              key={category.id}
                              className={`${s.catPill} ${active ? s.catPillActive : ''}`}
                              onClick={() => onCat(value)}
                            >
                              {category.name}
                            </button>
                          )
                        })}

                      {categoriesLoading &&
                        Array.from({ length: 4 }).map((_, index) => (
                          <span key={index} className={s.catSk} />
                        ))}
                    </div>

                    <div className={s.filterDivider} />

                    <div className={s.dropLabel}>Plage de prix</div>

                    <div className={s.priceGrid}>
                      <label className={s.priceField}>
                        <span className={s.fieldTitle}>Minimum</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={minPrice}
                          onChange={(e) => onMinPrice(e.target.value)}
                          placeholder="0"
                          className={s.priceInput}
                        />
                      </label>

                      <label className={s.priceField}>
                        <span className={s.fieldTitle}>Maximum</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={maxPrice}
                          onChange={(e) => onMaxPrice(e.target.value)}
                          placeholder="100000"
                          className={s.priceInput}
                        />
                      </label>
                    </div>

                    <div className={s.filterDivider} />

                    <div className={s.dropLabel}>Visuel</div>

                    <div className={s.toggleRow}>
                      <button
                        className={`${s.togglePill} ${hasImage === true ? s.togglePillActive : ''}`}
                        onClick={() => onHasImage(true)}
                      >
                        Avec image
                      </button>

                      <button
                        className={`${s.togglePill} ${hasImage === false ? s.togglePillActive : ''}`}
                        onClick={() => onHasImage(false)}
                      >
                        Sans image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={s.dropdown} ref={sortRef}>
                <button
                  className={`${s.dropBtn} ${sortOpen || sort !== 'published-desc' ? s.dropBtnActive : ''}`}
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

                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        className={`${s.sortOpt} ${sort === option.key ? s.sortOptActive : ''}`}
                        onClick={() => onSort(option.key)}
                      >
                        {option.label}
                        {sort === option.key && <span className={s.sortCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasFilters && (
                <button className={s.clearBtn} onClick={clearAll}>
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
                  “{search.trim()}”
                  <button onClick={() => onSearch('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {minPrice.trim() && (
                <span className={s.chip}>
                  Min {formatPrice(Number(minPrice))}
                  <button onClick={() => onMinPrice('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {maxPrice.trim() && (
                <span className={s.chip}>
                  Max {formatPrice(Number(maxPrice))}
                  <button onClick={() => onMaxPrice('')}>
                    <IconX />
                  </button>
                </span>
              )}

              {hasImage !== null && (
                <span className={s.chip}>
                  {hasImage ? 'Avec image' : 'Sans image'}
                  <button onClick={() => onHasImage(null)}>
                    <IconX />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className={s.resultsMeta}>
            <span className={s.resultsCount}>
              {!loading ? `${totalItems} produit${totalItems > 1 ? 's' : ''}` : 'Chargement…'}
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
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={s.skCard}>
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
            <h2>Aucun produit trouvé</h2>
            <p>Essayez une autre recherche ou réinitialisez les filtres appliqués.</p>
            {hasFilters && (
              <button className={s.resetBtn} onClick={clearAll}>
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  fmt={fmt}
                  onNavigate={(slugOrId) => nav.push(`/produits/${slugOrId}`)}
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

                {pages.map((item, index) =>
                  item === '…' ? (
                    <span key={`ellipsis-${index}`} className={s.pEll}>
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`${s.pBtn} ${item === page ? s.pActive : ''}`}
                      onClick={() => goPage(item as number)}
                      disabled={item === page || loading}
                    >
                      {item}
                    </button>
                  )
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