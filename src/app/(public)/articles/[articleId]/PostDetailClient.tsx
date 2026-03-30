'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import grapesjs, { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'

type PostTag = {
  tag: { id: string; name: string; slug: string }
}

type Post = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  status?: string | null
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  gjsHtml?: string | null
  gjsJs?: string | null
  gjsCss?: string | null
  gjsStyles?: unknown
  gjsComponents?: unknown
  author?: { id: string; email: string } | null
  category?: { id: string; name: string; slug: string } | null
  tags?: PostTag[]
}

function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, { label: string; className: string }> = {
    published: { label: 'Publié',    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' },
    draft:     { label: 'Brouillon', className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' },
    archived:  { label: 'Archivé',   className: 'bg-white/10 text-white/40 ring-1 ring-white/20' },
  }
  const badge = map[(status || '').toLowerCase()]
  if (!badge) return null
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</span>
      <div className="text-sm text-white/80">{children}</div>
    </div>
  )
}

export default function PostDetailClient() {
  const params    = useParams()
  const router    = useRouter()
  const { dark }  = useTheme()
  const articleId = params?.articleId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef   = useRef<Editor | null>(null)

  const [post, setPost]             = useState<Post | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(900)

  useEffect(() => {
    if (!articleId) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get(`/api/posts/${articleId}`)
        setPost(res.data)
      } catch (err) {
        console.error(err)
        setError('Impossible de charger ce post.')
      } finally {
        setLoading(false)
      }
    })()
  }, [articleId])

  useEffect(() => {
    if (!mountRef.current || !post || gjsRef.current) return

    const pageBg = dark ? '#020a1a' : '#ffffff'

    const editor = grapesjs.init({
      container: mountRef.current,
      height: '100%',
      width: '100%',
      fromElement: false,
      storageManager: false,
      panels: { defaults: [] },
      plugins: [],
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        ],
      },
      protectedCss: '',
    })

    gjsRef.current = editor

    editor.on('load', () => {
      if (post.gjsComponents) {
        editor.setComponents(post.gjsComponents as any)
      } else if (post.gjsHtml) {
        editor.setComponents(post.gjsHtml)
      }

      if (post.gjsStyles) {
        editor.setStyle(post.gjsStyles as any)
      } else if (post.gjsCss) {
        editor.setStyle(post.gjsCss)
      }

      const wrapper = editor.getWrapper() as any
      if (wrapper) {
        wrapper.addStyle({
          'background-color': pageBg,
          'min-height': 'auto',
          height: 'auto',
          margin: '0',
          padding: '0',
        })
      }

      const canvasDoc = editor.Canvas.getDocument()
      if (canvasDoc) {
        const oldPatch = canvasDoc.getElementById('post-first-section-fix')
        oldPatch?.remove()

        const style = canvasDoc.createElement('style')
        style.id = 'post-first-section-fix'
        style.innerHTML = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
            height: auto !important;
            background: ${pageBg} !important;
          }

          body {
            overflow-x: hidden !important;
          }

          body > section:first-of-type,
          body > div:first-of-type,
          body > main:first-of-type {
            margin-top: 0 !important;
            min-height: auto !important;
          }

          section:first-of-type,
          .hero:first-of-type,
          .hero-section:first-of-type {
            margin-top: 0 !important;
            min-height: auto !important;
          }
        `
        canvasDoc.head.appendChild(style)
      }

      if (post.gjsJs?.trim()) {
        if (canvasDoc) {
          const existing = canvasDoc.querySelector('script[data-post-js]')
          existing?.remove()
          const script = canvasDoc.createElement('script')
          script.setAttribute('data-post-js', 'true')
          script.text = post.gjsJs
          canvasDoc.body.appendChild(script)
        }
      }

      editor.runCommand('preview')
      measureHeight()
    })

    const measureHeight = () => {
      try {
        const iframeEl = editor.Canvas.getFrameEl()
        if (!iframeEl) return
        const innerDoc = iframeEl.contentDocument
        const body = innerDoc?.body
        const html = innerDoc?.documentElement
        if (!body || !html) return
        const h = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight, 900)
        setCanvasHeight(h)
      } catch {}
    }

    editor.on('canvas:frame:load:body', () => {
      measureHeight()
      setTimeout(measureHeight, 200)
      setTimeout(measureHeight, 600)
      setTimeout(measureHeight, 1200)
    })

    return () => {
      gjsRef.current?.destroy()
      gjsRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, dark])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-gray-400">Chargement…</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-gray-500">{error || 'Post introuvable.'}</p>
        <button onClick={() => router.back()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">
          Retour
        </button>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        body,
        #__next > *,
        main {
          padding: 0 !important;
          margin: 0 !important;
        
        }

        .gjs-viewer-root .gjs-editor {
          background: transparent !important;
          border: none !important;
        }

        .gjs-viewer-root .gjs-cv-canvas {
          top: 0px !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
        }

        .gjs-viewer-root .gjs-pn-panel,
        .gjs-viewer-root .gjs-pn-panels,
        .gjs-viewer-root [class*="gjs-pn-"],
        .gjs-viewer-root .gjs-off-prv {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        .gjs-viewer-root .gjs-cv-canvas__frames {
          pointer-events: none;
        }
        .gjs-viewer-root .gjs-cv-canvas__frames iframe {
          pointer-events: auto !important;
        }

        .gjs-viewer-root .gjs-toolbar,
        .gjs-viewer-root .gjs-badge,
        .gjs-viewer-root .gjs-highlighter,
        .gjs-viewer-root .gjs-placeholder,
        .gjs-viewer-root .gjs-spot-default {
          display: none !important;
        }

        html,
        body {
          background: transparent !important;
        }
      `}</style>

      <div
        className="gjs-viewer-root"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          overflow: 'auto',
        }}
      >
        <div style={{ height: `${canvasHeight}px`, width: '100%', position: 'relative' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 text-white/80 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 items-center gap-2 rounded-xl bg-black/60 px-3.5 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Détails
        </button>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}