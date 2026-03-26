'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/app/lib/axios'

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
  pagination: {
    totalPages: number
    currentPage?: number
    totalItems?: number
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

const PublicArticlesPage = ({ router }: PublicArticlesPageProps) => {
  const nextRouter = useRouter()
  const navigation = router ?? nextRouter

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const searchRef = useRef<HTMLInputElement>(null)

  const staggerIn = useStaggeredIn(articles.length)

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

  const loadArticles = useCallback(
    async (page: number, keyword: string, categoryId: string) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        if (keyword.trim()) params.set('search', keyword.trim())
        if (categoryId) params.set('categoryId', categoryId)

        const res = await api.get<ArticlesResponse>(`/api/articles?${params.toString()}`)
        setArticles(res.data.data ?? [])
        setTotalPages(res.data.pagination?.totalPages ?? 1)
      } catch (err) {
        console.error('Erreur chargement articles :', err)
        setError('Impossible de charger les articles.')
        setArticles([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadArticles(currentPage, search, selectedCategory)
  }, [currentPage, search, selectedCategory, loadArticles])

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
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setCurrentPage(1)
    searchRef.current?.focus()
  }

  const getExcerpt = (excerpt: string | null) => {
    if (!excerpt?.trim()) return 'Aucun extrait disponible pour cet article.'
    return excerpt.length > 140 ? `${excerpt.slice(0, 140)}…` : excerpt
  }

  const hasFilters = search.trim() !== '' || selectedCategory !== ''

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('…')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <>
      <div className="articles-page">
        <div className="articles-container">
          <header className="articles-header">
            <div>
              <div className="articles-kicker-row">
                <span className="articles-kicker">Actualités</span>
                <span className="articles-kicker-line" />
              </div>

              <h1 className="articles-title">
                Nos derniers
                <br />
                <span>articles</span>
              </h1>

              <p className="articles-subtitle">
                Découvrez nos publications, nouveautés et informations importantes — mis à jour régulièrement.
              </p>
            </div>

            {!loading && articles.length > 0 && (
              <div className="articles-count">
                {articles.length} article{articles.length > 1 ? 's' : ''}
              </div>
            )}
          </header>

          <section className="filters-card">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher un article…"
                className="search-input"
              />

              {search && (
                <button className="search-clear" onClick={() => handleSearchChange('')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="chips-row">
              <span className="chips-label">Filtres :</span>

              <div className="chips-scroll">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`chip ${!selectedCategory ? 'chip-active' : ''}`}
                >
                  Toutes
                </button>

                {!categoriesLoading &&
                  categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`chip ${selectedCategory === cat.id ? 'chip-active' : ''}`}
                    >
                      {cat.name}
                    </button>
                  ))}

                {categoriesLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="chip-skeleton" />
                  ))}
              </div>

              {hasFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Effacer
                </button>
              )}
            </div>
          </section>

          {error && <div className="error-box">{error}</div>}

          {loading ? (
            <div className="articles-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-skeleton">
                  <div className="skeleton skeleton-image" />
                  <div className="card-skeleton-body">
                    <div className="skeleton skeleton-small" />
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-button" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.75">
                  <path d="M19 21H5a2 2 0 0 1-2-2V8l5-5h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2Z" />
                  <path d="M9 3v5h5" />
                  <path d="M9 13h6M9 17h4" />
                </svg>
              </div>

              <h2>Aucun article trouvé</h2>
              <p>Modifiez votre recherche ou réinitialisez les filtres pour explorer tous les articles.</p>

              {hasFilters && (
                <button className="primary-btn" onClick={clearFilters}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {articles.map((article, idx) => (
                  <article
                    key={article.id}
                    onClick={() => handleArticleClick(article.id)}
                    className={`article-card ${staggerIn ? 'stagger-in' : ''}`}
                    style={staggerIn ? { animationDelay: `${idx * 55}ms` } : { opacity: 0 }}
                  >
                    <div className="article-card-media">
                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="article-image"
                        />
                      ) : (
                        <div className="article-placeholder">
                          <span>Actualité</span>
                        </div>
                      )}

                      {article.category?.name && (
                        <div className="article-category-badge">{article.category.name}</div>
                      )}

                      <div className="article-date-overlay">
                        {formatDate.format(new Date(article.createdAt))}
                      </div>
                    </div>

                    <div className="article-card-body">
                      <h2 className="article-card-title">{article.title}</h2>
                      <p className="article-card-excerpt">{getExcerpt(article.excerpt)}</p>

                      <div className="article-card-footer">
                        <span>Lire l'article</span>

                        <button
                          type="button"
                          className="read-more-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArticleClick(article.id)
                          }}
                        >
                          Lire plus
                          <svg className="read-more-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="pagination-arrow"
                    aria-label="Page précédente"
                  >
                    ‹
                  </button>

                  {pageNumbers.map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        disabled={p === currentPage || loading}
                        className={`pagination-number ${p === currentPage ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="pagination-arrow"
                    aria-label="Page suivante"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .articles-page {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(160deg, #fff 0%, #fdf5ef 55%, #f8f8f6 100%);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        .articles-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 48px 24px;
          box-sizing: border-box;
        }

        .articles-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .articles-kicker-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .articles-kicker {
          display: inline-block;
          background: #ea580c;
          color: #fff;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          border-radius: 3px;
        }

        .articles-kicker-line {
          width: 48px;
          height: 1px;
          background: #ea580c;
          opacity: 0.35;
        }

        .articles-title {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          line-height: 1.08;
          font-weight: 700;
          color: #111827;
        }

        .articles-title span {
          color: #ea580c;
          font-style: italic;
        }

        .articles-subtitle {
          margin-top: 14px;
          max-width: 600px;
          color: #6b7280;
          font-size: 16px;
          line-height: 1.7;
          font-weight: 300;
        }

        .articles-count {
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #6b7280;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0,0,0,.05);
        }

        .filters-card {
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 2px 20px rgba(0,0,0,.06);
          margin-bottom: 36px;
        }

        .search-box {
          position: relative;
          margin-bottom: 18px;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 14px;
          padding: 14px 44px 14px 44px;
          font-size: 14px;
          color: #111827;
          transition: .2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #fb923c;
          box-shadow: 0 0 0 3px rgba(234,88,12,.18);
          background: #fff;
        }

        .search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 999px;
        }

        .search-clear:hover {
          color: #4b5563;
          background: #f3f4f6;
        }

        .search-clear svg {
          width: 14px;
          height: 14px;
        }

        .chips-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chips-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .chips-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          flex: 1;
        }

        .chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .chip {
          flex-shrink: 0;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .chip:hover {
          transform: translateY(-1px);
          border-color: #fb923c;
          color: #ea580c;
        }

        .chip-active {
          background: #ea580c;
          color: #fff;
          border-color: #ea580c;
        }

        .chip-skeleton {
          width: 80px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.4s infinite linear;
          flex-shrink: 0;
        }

        .clear-filters-btn {
          border: 1px dashed #d1d5db;
          background: #fff;
          color: #6b7280;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .clear-filters-btn:hover {
          color: #ef4444;
          border-color: #fca5a5;
        }

        .error-box {
          margin-bottom: 24px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .article-card,
        .card-skeleton {
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 2px 14px rgba(0,0,0,.05);
        }

        .article-card {
          cursor: pointer;
          transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s cubic-bezier(.22,.61,.36,1);
        }

        .article-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 28px rgba(0,0,0,.10);
        }

        .article-card-media {
          position: relative;
          height: 230px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .article-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .6s cubic-bezier(.22,.61,.36,1);
        }

        .article-card:hover .article-image {
          transform: scale(1.06);
        }

        .article-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
        }

        .article-placeholder span {
          background: rgba(255,255,255,.85);
          color: #ea580c;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .18em;
        }

        .article-category-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(255,255,255,.88);
          color: #374151;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .1em;
          backdrop-filter: blur(8px);
        }

        .article-date-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 16px 16px 10px;
          background: linear-gradient(to top, rgba(0,0,0,.45), transparent);
          color: #fff;
          font-size: 12px;
          font-weight: 500;
        }

        .article-card-body {
          padding: 20px;
        }

        .article-card-title {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          line-height: 1.25;
          font-weight: 600;
          color: #111827;
          transition: color .2s ease;
        }

        .article-card:hover .article-card-title {
          color: #ea580c;
        }

        .article-card-excerpt {
          margin-top: 14px;
          min-height: 74px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.75;
          font-weight: 300;
        }

        .article-card-footer {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .article-card-footer span {
          color: #9ca3af;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .read-more-btn,
        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          border-radius: 999px;
          background: #ea580c;
          color: #fff;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: .2s ease;
        }

        .read-more-btn:hover,
        .primary-btn:hover {
          opacity: .92;
        }

        .read-more-arrow {
          width: 14px;
          height: 14px;
          transition: transform .22s ease;
        }

        .article-card:hover .read-more-arrow {
          transform: translateX(4px);
        }

        .empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 24px;
          border: 1px dashed #e5e7eb;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 2px 14px rgba(0,0,0,.05);
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: linear-gradient(135deg,#fff1e6,#ffe0c8);
          margin-bottom: 18px;
        }

        .empty-icon svg {
          width: 28px;
          height: 28px;
        }

        .empty-box h2 {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #111827;
        }

        .empty-box p {
          max-width: 380px;
          margin-top: 10px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 300;
        }

        .empty-box .primary-btn {
          margin-top: 22px;
        }

        .pagination {
          margin-top: 42px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pagination-arrow,
        .pagination-number {
          min-width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,.04);
          transition: .18s ease;
        }

        .pagination-arrow:hover,
        .pagination-number:hover {
          transform: scale(1.06);
        }

        .pagination-number.active {
          background: #ea580c;
          color: #fff;
          border-color: #ea580c;
        }

        .pagination-arrow:disabled,
        .pagination-number:disabled {
          opacity: .45;
          cursor: default;
          transform: none;
        }

        .pagination-ellipsis {
          padding: 0 4px;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 700;
        }

        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 8px;
        }

        .skeleton-image {
          height: 230px;
          border-radius: 0;
        }

        .card-skeleton-body {
          padding: 20px;
        }

        .skeleton-small {
          width: 80px;
          height: 14px;
          margin-bottom: 12px;
        }

        .skeleton-title {
          width: 78%;
          height: 28px;
          margin-bottom: 14px;
        }

        .skeleton-line {
          width: 100%;
          height: 14px;
          margin-bottom: 10px;
        }

        .skeleton-line.short {
          width: 72%;
        }

        .skeleton-button {
          width: 110px;
          height: 38px;
          margin-top: 18px;
          border-radius: 999px;
        }

        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stagger-in {
          opacity: 0;
          animation: fadeUp .5s ease forwards;
        }

        @media (max-width: 1100px) {
          .articles-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .articles-title {
            font-size: 46px;
          }
        }

        @media (max-width: 768px) {
          .articles-container {
            padding: 34px 16px;
          }

          .articles-header {
            margin-bottom: 28px;
          }

          .articles-title {
            font-size: 38px;
          }

          .articles-subtitle {
            font-size: 15px;
          }

          .articles-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .filters-card {
            padding: 16px;
          }

          .chips-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .chips-scroll {
            width: 100%;
          }

          .clear-filters-btn {
            align-self: flex-end;
          }

          .article-card-title {
            font-size: 22px;
          }

          .article-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  )
}

export default PublicArticlesPage