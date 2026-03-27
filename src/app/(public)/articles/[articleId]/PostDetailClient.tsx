'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/app/lib/axios'

type Post = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  status?: string
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  gjsHtml?: string | null
  gjsCss?: string | null
  gjsStyles?: any
}

function grapesStyleToCss(styles: any): string {
  if (!styles) return ''

  if (typeof styles === 'string') return styles

  if (!Array.isArray(styles)) return ''

  try {
    return styles
      .map((rule: any) => {
        const selectors = Array.isArray(rule.selectors)
          ? rule.selectors
              .map((sel: any) => {
                if (typeof sel === 'string') return sel
                if (sel?.name) return `.${sel.name}`
                return ''
              })
              .filter(Boolean)
              .join(', ')
          : ''

        const styleObj = rule.style || {}
        const declarations = Object.entries(styleObj)
          .map(([key, value]) => {
            const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            return `${cssKey}: ${value};`
          })
          .join(' ')

        if (!selectors || !declarations) return ''
        return `${selectors} { ${declarations} }`
      })
      .join('\n')
  } catch {
    return ''
  }
}

export default function PostDetailClient() {
  const router = useRouter()
  const params = useParams()
  const articleId = params?.articleId as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!articleId) return

    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/api/posts/${articleId}`)
        setPost(res.data)
      } catch {
        setError('Impossible de charger ce post.')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [articleId])

  const previewCss = useMemo(() => {
    if (!post) return ''

    const rawCss =
      post.gjsCss ||
      (typeof post.gjsStyles === 'string'
        ? post.gjsStyles
        : grapesStyleToCss(post.gjsStyles))

    return `
      .post-preview-root,
      .post-preview-root * {
        box-sizing: border-box;
      }

      .post-preview-root {
        width: 100%;
        min-height: calc(100vh - 72px);
        background: #ffffff;
        color: #111827;
        overflow-x: hidden;
      }

      .post-preview-root img,
      .post-preview-root video,
      .post-preview-root canvas,
      .post-preview-root svg,
      .post-preview-root iframe {
        max-width: 100%;
      }

      .post-preview-root table {
        width: 100%;
        border-collapse: collapse;
      }

      .post-preview-root .gjs-row,
      .post-preview-root .row {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        max-width: 100%;
      }

      .post-preview-root .gjs-cell,
      .post-preview-root [class*="col-"] {
        max-width: 100%;
      }

      ${rawCss || ''}
    `
  }, [post])

  const previewHtml = useMemo(() => {
    if (!post?.gjsHtml) {
      return `<div style="padding:24px;">Aucun contenu HTML à afficher.</div>`
    }

    return post.gjsHtml
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
  }, [post])

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex h-screen items-center justify-center text-gray-600">
          Chargement...
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex h-screen flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
          <p className="mt-3 text-gray-700">{error || 'Post introuvable.'}</p>
          <button
            onClick={() => router.push('/articles')}
            className="mt-6 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Retour aux articles
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-gray-900">
            {post.title}
          </h1>
          {post.publishedAt && (
            <p className="text-sm text-gray-500">
              Publié le{' '}
              {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        <button
          onClick={() => router.push('/articles')}
          className="ml-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Retour
        </button>
      </header>

      <style dangerouslySetInnerHTML={{ __html: previewCss }} />

      <section
        className="post-preview-root"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </main>
  )
}