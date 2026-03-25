'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '@/app/lib/axios'

const ArticleDetailPage = () => {
  const [article, setArticle] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { articleId } = router.query

  useEffect(() => {
    if (!articleId) return

    setLoading(true)
    setError(null)
    api.get(`/api/articles/${articleId}`)
      .then((res) => setArticle(res.data))
      .catch(() => setError('Impossible de charger cet article.'))
      .finally(() => setLoading(false))
  }, [articleId])

  if (loading) return <div>Chargement...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">{article?.title}</h1>
      <p className="text-gray-700 mt-4">{article?.content}</p>
      <div className="mt-6">
        <button
          onClick={() => router.push('/articles')}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Retour aux articles
        </button>
      </div>
    </div>
  )
}

export default ArticleDetailPage