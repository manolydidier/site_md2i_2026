'use client'
import { useState, useEffect } from 'react'
import api from '@/app/lib/axios'

const PublicArticlesPage = ({ router }: { router: any }) => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch articles
  const loadArticles = async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/articles?page=${page}`)
      setArticles(res.data.data)
      setTotalPages(res.data.pagination.totalPages)
    } catch {
      setError('Impossible de charger les articles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles(currentPage)
  }, [currentPage])

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadArticles(page)
  }

  // Redirect to article detail page
  const handleArticleClick = (articleId: string) => {
    router.push(`/articles/${articleId}`)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Actualités</h1>
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Article list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center">Chargement...</div>
        ) : (
          articles.map((article: any) => (
            <div
              key={article.id}
              className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition duration-300 cursor-pointer"
              onClick={() => handleArticleClick(article.id)}
            >
              <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
              <p className="text-gray-700 mt-4">{article.content.slice(0, 100)}...</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500">{new Date(article.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleArticleClick(article.id)}
                  className="text-blue-500 hover:underline"
                >
                  Lire plus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-4 py-2 text-lg text-gray-700">
          Page {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

export default PublicArticlesPage