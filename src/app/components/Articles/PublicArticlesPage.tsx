'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import styles from './PublicArticlesPage.module.css'

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
  categories?: Category[]
  pagination: {
    page?: number
    limit?: number
    total?: number
    totalPages: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
}

interface CategoriesResponse extends Array<Category> {}

interface PublicArticlesPageProps {
  router?: { push: (href: string) => void }
}

function useStaggeredIn(count: number) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [count])

  return visible
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
      setShowTop(scrolled > 400)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { progress, showTop }
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 2v4M16 2v4M3 10h18" />
    <rect x="3" y="4" width="18" height="18" rx="3" />
  </svg>
)

const PublicArticlesPage = ({ router }: PublicArticlesPageProps) => {
  const nextRouter = useRouter()
  const navigation = router ?? nextRouter
  const { dark } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const searchRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)

  const staggerIn = useStaggeredIn(articles.length)
  const isDark = mounted ? dark : false
  const { progress, showTop } = useScrollProgress()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search])

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    []
  )

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)

    try {
      const res = await api.get<CategoriesResponse>('/api/categories')
      setCategories(res.data ?? [])
    } catch (err) {
      console.error('Erreur chargement catégories :', err)
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const loadArticles = useCallback(async (page: number, keyword: string, category: string) => {
    setLoading(true)
    setError(null)

    const currentRequestId = ++requestIdRef.current

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '9')

      if (keyword.trim()) params.set('search', keyword.trim())
      if (category) params.set('category', category)

      const res = await api.get<ArticlesResponse>(`/api/articles/public?${params.toString()}`)

      if (currentRequestId !== requestIdRef.current) return

      setArticles(res.data.data ?? [])
      setTotalPages(res.data.pagination?.totalPages ?? 1)
      setTotalItems(res.data.pagination?.total ?? res.data.data?.length ?? 0)
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return

      console.error('Erreur chargement articles :', err)
      setError('Impossible de charger les articles.')
      setArticles([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadArticles(currentPage, debouncedSearch, selectedCategory)
  }, [currentPage, debouncedSearch, selectedCategory, loadArticles])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleArticleClick = (id: string) => {
    navigation.push(`/articles/${id}`)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (currentPage !== 1) setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    if (currentPage !== 1) setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setSelectedCategory('')
    setCurrentPage(1)
    searchRef.current?.focus()
  }

  const getExcerpt = (excerpt: string | null) => {
    if (!excerpt?.trim()) return 'Aucun extrait disponible pour cet article.'
    return excerpt.length > 145 ? `${excerpt.slice(0, 145)}…` : excerpt
  }

  const hasFilters = search.trim() !== '' || selectedCategory !== ''

  const selectedCategoryName =
    categories.find((cat) => cat.slug === selectedCategory)?.name ?? 'Toutes les catégories'

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('…')

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <div
      className={styles.articlesPage}
      data-theme={isDark ? 'dark' : 'light'}
      suppressHydrationWarning
    >
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.articlesContainer}>
        <header className={styles.articlesHeader}>
          <div className={styles.headerCopy}>
            <div className={styles.articlesKicker}>
              <span className={styles.kickerDot} />
              Actualités
            </div>

            <h1 className={styles.articlesTitle}>
              Nos dernières <span>Actualités</span>
            </h1>

            <p className={styles.articlesSubtitle}>
              Découvrez nos publications, nouveautés et informations importantes concernant nos activités et projets.
              Restez informé des dernières tendances et évolutions dans le domaine de l&apos;IT et de la transformation digitale.
            </p>
          </div>

          <div className={styles.headerMeta}>
            <div className={styles.statsPill}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{!loading ? totalItems : '—'}</span>
                <span className={styles.statLabel}>articles</span>
              </div>

              <div className={styles.statDivider} />

              <div className={styles.statItem}>
                <span className={styles.statValue}>{categories.length || '—'}</span>
                <span className={styles.statLabel}>catégories</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.stickyWrapper}>
          <section className={styles.filtersCard}>
            <div className={styles.searchRow}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>
                  <SearchIcon />
                </span>

                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher un article, un thème ou une catégorie…"
                  className={styles.searchInput}
                />

                {search && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => handleSearchChange('')}
                    aria-label="Effacer la recherche"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.chipsRow}>
              <span className={styles.chipsLabel}>Catégories</span>

              <div className={styles.chipsScroll}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('')}
                  className={`${styles.chip} ${!selectedCategory ? styles.chipActive : ''}`}
                >
                  Toutes
                </button>

                {!categoriesLoading &&
                  categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug ?? '')}
                      className={`${styles.chip} ${
                        selectedCategory === (cat.slug ?? '') ? styles.chipActive : ''
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}

                {categoriesLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className={styles.chipSkeleton} />
                  ))}
              </div>

              {hasFilters && (
                <button type="button" className={styles.clearFiltersBtn} onClick={clearFilters}>
                  Effacer
                </button>
              )}
            </div>

            <div className={styles.resultsBar}>
              <div className={styles.resultsText}>
                <span className={styles.resultsHighlight}>
                  {!loading
                    ? `${totalItems} résultat${totalItems > 1 ? 's' : ''}`
                    : 'Chargement…'}
                </span>

                {hasFilters && (
                  <>
                    <span className={styles.resultsDot}>•</span>
                    <span>{selectedCategoryName}</span>

                    {search.trim() && (
                      <>
                        <span className={styles.resultsDot}>•</span>
                        <span>"{search.trim()}"</span>
                      </>
                    )}
                  </>
                )}
              </div>

              {totalPages > 1 && !loading && (
                <span className={styles.pageIndicator}>
                  Page {currentPage}/{totalPages}
                </span>
              )}
            </div>
          </section>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {loading ? (
          <div className={styles.articlesGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.cardSkeleton}>
                <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
                <div className={styles.cardSkeletonBody}>
                  <div className={`${styles.skeleton} ${styles.skeletonSmall}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.short}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyIcon}>
              <SearchIcon />
            </div>

            <h2>Aucune actualité trouvée</h2>
            <p>Essayez un autre mot-clé ou réinitialisez les filtres pour tout afficher.</p>

            {hasFilters && (
              <button type="button" className={styles.primaryBtn} onClick={clearFilters}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.articlesGrid}>
              {articles.map((article, idx) => (
                <article
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)}
                  className={`${styles.articleCard} ${staggerIn ? styles.staggerIn : ''}`}
                  style={staggerIn ? { animationDelay: `${idx * 55}ms` } : { opacity: 0 }}
                >
                  <div className={styles.articleCardMedia}>
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className={styles.articleImage}
                      />
                    ) : (
                      <div className={styles.articlePlaceholder}>
                        <span>{article.category?.name ?? 'Article'}</span>
                      </div>
                    )}

                    <div className={styles.mediaOverlay} />

                    {article.category?.name && (
                      <div className={styles.articleCategoryBadge}>{article.category.name}</div>
                    )}

                    <div className={styles.articleDateBadge}>
                      <span className={styles.articleDateIcon}>
                        <CalendarIcon />
                      </span>
                      {formatDate.format(new Date(article.createdAt))}
                    </div>
                  </div>

                  <div className={styles.articleCardBody}>
                    <div className={styles.articleMetaLine}>
                      <span className={styles.articleMetaTag}>Publication</span>
                      <span className={styles.articleMetaDot}>•</span>
                      <span className={styles.articleMetaTag}>Lecture rapide</span>
                    </div>

                    <h2 className={styles.articleCardTitle}>{article.title}</h2>
                    <p className={styles.articleCardExcerpt}>{getExcerpt(article.excerpt)}</p>

                    <div className={styles.articleCardFooter}>
                      <span className={styles.articleReadLabel}>Voir le détail</span>

                      <button
                        type="button"
                        className={styles.readMoreBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArticleClick(article.id)
                        }}
                      >
                        Lire plus
                        <span className={styles.readMoreArrow}>
                          <ArrowRightIcon />
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className={styles.paginationArrow}
                  aria-label="Page précédente"
                >
                  ‹
                </button>

                {pageNumbers.map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className={styles.paginationEllipsis}>
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={p}
                      onClick={() => handlePageChange(p)}
                      disabled={p === currentPage || loading}
                      className={`${styles.paginationNumber} ${
                        p === currentPage ? styles.active : ''
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className={styles.paginationArrow}
                  aria-label="Page suivante"
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
        className={`${styles.scrollTopBtn} ${showTop ? styles.scrollTopVisible : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Retour en haut"
      >
        <ArrowUpIcon />
      </button>
    </div>
  )
}

export default PublicArticlesPage