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

type CanvasEventHandlers = {
  preventDrag: (e: Event) => boolean
  preventContextMenu: (e: Event) => boolean
  preventSelectStart: (e: Event) => void
  preventCopy: (e: Event) => boolean | void
  preventPaste: (e: Event) => boolean | void
}

function StatusBadge({ status, dark }: { status?: string | null; dark: boolean }) {
  const map: Record<string, { label: string; className: string }> = {
    published: {
      label: 'Publié',
      className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    },
    draft: {
      label: 'Brouillon',
      className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    },
    archived: {
      label: 'Archivé',
      className: dark
        ? 'bg-white/10 text-white/45 ring-1 ring-white/20'
        : 'bg-black/5 text-black/45 ring-1 ring-black/10',
    },
  }

  const badge = map[(status || '').toLowerCase()]
  if (!badge) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  )
}

function DetailRow({
  label,
  children,
  dark,
}: {
  label: string
  children: React.ReactNode
  dark: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`text-[10px] font-semibold uppercase tracking-widest ${
          dark ? 'text-white/30' : 'text-black/35'
        }`}
      >
        {label}
      </span>
      <div className={`text-sm ${dark ? 'text-white/80' : 'text-black/80'}`}>{children}</div>
    </div>
  )
}

function getUiColors(dark: boolean) {
  return {
    panelBg: dark ? '#0a0a1f' : '#ffffff',
    panelBgSoft: dark ? 'rgba(10, 10, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    panelBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.10)',
    buttonBg: dark ? 'rgba(0,0,0,.60)' : 'rgba(255,255,255,.88)',
    buttonBgHover: dark ? 'rgba(0,0,0,.80)' : 'rgba(255,255,255,1)',
    buttonText: dark ? 'rgba(255,255,255,.90)' : 'rgba(24,24,24,.86)',
    buttonBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)',
    appBg: dark ? '#020617' : '#f8fafc',
    mutedText: dark ? '#6b7280' : '#6b7280',
  }
}

function syncEmbeddedTheme(editor: Editor, dark: boolean) {
  const canvasDoc = editor.Canvas?.getDocument()
  if (!canvasDoc) return

  const theme = dark ? 'dark' : 'light'
  const pageBg = dark ? '#000000' : '#ffffff'
  const pageText = dark ? '#f5f7fb' : '#181818'

  let baseStyle = canvasDoc.getElementById('viewer-base-style') as HTMLStyleElement | null
  if (!baseStyle) {
    baseStyle = canvasDoc.createElement('style')
    baseStyle.id = 'viewer-base-style'
    canvasDoc.head.appendChild(baseStyle)
  }

  baseStyle.innerHTML = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${pageBg} !important;
      color: ${pageText} !important;
    }
  `

  canvasDoc.documentElement.setAttribute('data-app-theme', theme)
  canvasDoc.body.setAttribute('data-app-theme', theme)

  const themeRoot = (
    canvasDoc.querySelector('.project-theme') ||
    canvasDoc.querySelector('.md2i-support') ||
    canvasDoc.querySelector('[data-theme]')
  ) as HTMLElement | null

  if (themeRoot) {
    themeRoot.setAttribute('data-theme', theme)
    themeRoot.style.background = pageBg
    themeRoot.style.color = pageText
    themeRoot.style.minHeight = '100%'
  }

  const wrapper = editor.getWrapper() as any
  if (wrapper) {
    wrapper.addStyle({
      'background-color': pageBg,
      color: pageText,
      'min-height': '100%',
      height: 'auto',
      margin: '0',
      padding: '0',
    })
  }

  editor.refresh()
}

function measureCanvasHeight(editor: Editor, setCanvasHeight: (height: number) => void) {
  try {
    const iframeEl = editor.Canvas.getFrameEl()
    if (iframeEl?.contentDocument) {
      const body = iframeEl.contentDocument.body
      const html = iframeEl.contentDocument.documentElement

      if (body && html) {
        const h = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.scrollHeight,
          html.offsetHeight,
          900
        )
        setCanvasHeight(h)
      }
    }
  } catch (e) {
    console.warn('Error measuring height:', e)
  }
}

export default function PostDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { dark } = useTheme()
  const articleId = params?.articleId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef = useRef<Editor | null>(null)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(900)

  const ui = getUiColors(dark)

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
    if (!mountRef.current || !post) return

    if (gjsRef.current) {
      gjsRef.current.destroy()
      gjsRef.current = null
    }

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
      editable: false,
      components: {
        defaults: {
          editable: false,
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
          copyable: false,
          removable: false,
        },
      },
      commands: {
        defaults: [
          { id: 'core:component:delete', run: () => {} },
          { id: 'core:component:copy', run: () => {} },
          { id: 'core:component:paste', run: () => {} },
          { id: 'core:component:duplicate', run: () => {} },
          { id: 'core:component:move', run: () => {} },
          { id: 'core:component:select', run: () => {} },
          { id: 'core:component:style', run: () => {} },
          { id: 'core:component:enter', run: () => {} },
          { id: 'core:component:exit', run: () => {} },
          { id: 'core:component:remove', run: () => {} },
          { id: 'core:component:create', run: () => {} },
          { id: 'core:component:add', run: () => {} },
          { id: 'core:component:clone', run: () => {} },
        ],
      },
      dragManager: { disable: true },
      selectorManager: { disable: true },
      traitManager: { disable: true },
      styleManager: { disable: true },
      layerManager: { disable: true },
      blockManager: { disable: true },
      deviceManager: { disable: true },
      allowScripts: true,
    })

    gjsRef.current = editor

    editor.on('component:selected', () => {
      editor.select(null)
    })

    editor.on('component:mouseover', () => {
      editor.getHighlighter().remove()
    })

    editor.on('load', () => {
      const commands = editor.Commands.getAll()

      Object.keys(commands).forEach((cmdId) => {
        if (cmdId.startsWith('core:')) {
          editor.Commands.add(cmdId, {
            run: () => {},
            stop: () => {},
          })
        }
      })

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

      const allComponents = editor.getComponents()

      const disableComponent = (component: any) => {
        if (component && component.set) {
          component.set('editable', false)
          component.set('draggable', false)
          component.set('selectable', false)
          component.set('hoverable', false)
          component.set('highlightable', false)
          component.set('copyable', false)
          component.set('removable', false)
          component.set('toolbar', null)
          component.set('badge', null)

          if (component.components && component.components().length > 0) {
            component.components().forEach((child: any) => disableComponent(child))
          }
        }
      }

      allComponents.forEach((component: any) => disableComponent(component))

      const setupCanvas = () => {
        try {
          const canvasDoc = editor.Canvas?.getDocument()
          if (!canvasDoc) {
            setTimeout(setupCanvas, 50)
            return
          }

          let readonlyStyle = canvasDoc.getElementById('readonly-styles') as HTMLStyleElement | null
          if (!readonlyStyle) {
            readonlyStyle = canvasDoc.createElement('style')
            readonlyStyle.id = 'readonly-styles'
            canvasDoc.head.appendChild(readonlyStyle)
          }

          readonlyStyle.innerHTML = `
            * {
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              -webkit-user-drag: none !important;
              user-drag: none !important;
              -webkit-tap-highlight-color: transparent !important;
              cursor: default !important;
            }
            *:active, *:focus { outline: none !important; }
            a, button, [role="button"], input, select, textarea {
              user-select: text !important;
              -webkit-user-select: text !important;
              cursor: pointer !important;
            }
            img, svg, canvas {
              pointer-events: none !important;
              user-select: none !important;
            }
            ::selection, ::-moz-selection { background: transparent !important; }
          `

          const preventDrag = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }
          const preventContextMenu = (e: Event) => {
            e.preventDefault()
            return false
          }
          const preventSelectStart = (e: Event) => {
            const target = e.target as HTMLElement
            if (
              !target.closest('input') &&
              !target.closest('textarea') &&
              !target.closest('[contenteditable="true"]')
            ) {
              e.preventDefault()
            }
          }
          const preventCopy = (e: Event) => {
            const target = e.target as HTMLElement
            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          }
          const preventPaste = (e: Event) => {
            const target = e.target as HTMLElement
            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          }

          canvasDoc.body.addEventListener('dragstart', preventDrag)
          canvasDoc.body.addEventListener('drop', preventDrag)
          canvasDoc.body.addEventListener('dragenter', preventDrag)
          canvasDoc.body.addEventListener('dragover', preventDrag)
          canvasDoc.body.addEventListener('dragend', preventDrag)
          canvasDoc.body.addEventListener('contextmenu', preventContextMenu)
          canvasDoc.body.addEventListener('selectstart', preventSelectStart)
          canvasDoc.body.addEventListener('copy', preventCopy)
          canvasDoc.body.addEventListener('paste', preventPaste)

          ;(editor as any).__eventHandlers = {
            preventDrag,
            preventContextMenu,
            preventSelectStart,
            preventCopy,
            preventPaste,
          } satisfies CanvasEventHandlers

          if (post.gjsJs?.trim()) {
            const existing = canvasDoc.querySelector('script[data-post-js]')
            if (existing) existing.remove()
            const script = canvasDoc.createElement('script')
            script.setAttribute('data-post-js', 'true')
            script.text = post.gjsJs
            canvasDoc.body.appendChild(script)
          }

          syncEmbeddedTheme(editor, dark)

          setTimeout(() => {
            measureCanvasHeight(editor, setCanvasHeight)
          }, 180)

          editor.runCommand('preview')
        } catch (e) {
          console.warn('Error setting up canvas:', e)
        }
      }

      setupCanvas()
    })

    return () => {
      if (gjsRef.current) {
        const currentEditor = gjsRef.current
        try {
          const canvasDoc = currentEditor.Canvas?.getDocument()
          const handlers = (currentEditor as any).__eventHandlers as CanvasEventHandlers | undefined
          if (canvasDoc && handlers) {
            canvasDoc.body.removeEventListener('dragstart', handlers.preventDrag)
            canvasDoc.body.removeEventListener('drop', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragenter', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragover', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragend', handlers.preventDrag)
            canvasDoc.body.removeEventListener('contextmenu', handlers.preventContextMenu)
            canvasDoc.body.removeEventListener('selectstart', handlers.preventSelectStart)
            canvasDoc.body.removeEventListener('copy', handlers.preventCopy)
            canvasDoc.body.removeEventListener('paste', handlers.preventPaste)
          }
        } catch {}
        currentEditor.destroy()
        gjsRef.current = null
      }
    }
  }, [post])

  useEffect(() => {
    const editor = gjsRef.current
    if (!editor) return
    syncEmbeddedTheme(editor, dark)
    setTimeout(() => {
      measureCanvasHeight(editor, setCanvasHeight)
    }, 120)
  }, [dark])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: ui.appBg }}>
        <div className="text-sm" style={{ color: ui.mutedText }}>Chargement…</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ background: ui.appBg }}>
        <p className="text-sm" style={{ color: ui.mutedText }}>{error || 'Post introuvable.'}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm transition"
          style={{ background: '#111827', color: '#ffffff' }}
        >
          Retour
        </button>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* GrapesJS overrides */
        .gjs-pn-panel,
        .gjs-pn-panels,
        [class*='gjs-pn-'],
        .gjs-off-prv,
        .gjs-toolbar,
        .gjs-badge,
        .gjs-highlighter,
        .gjs-placeholder,
        .gjs-spot-default,
        .gjs-tooltip,
        .gjs-toolbar-item,
        .gjs-badge-edit {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }

        .gjs-cv-canvas {
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: visible !important;
        }

        .gjs-cv-canvas__frames {
          pointer-events: none;
          width: 100% !important;
          height: 100% !important;
        }

        .gjs-cv-canvas__frames iframe {
          pointer-events: auto !important;
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          z-index: 1 !important;
        }

        .gjs-editor {
          background: transparent !important;
          border: none !important;
          height: 100% !important;
        }

        .gjs-cv-canvas * { pointer-events: none !important; }
        .gjs-cv-canvas__frames iframe * { pointer-events: auto !important; }
      `}</style>

      {/*
       * STRUCTURE :
       *
       *  <root>                          ← h-screen, pas d'overflow
       *    <scroll-zone>                 ← overflow-y:auto, scroll ici
       *      <canvas-wrapper>            ← hauteur dynamique GrapesJS
       *    </scroll-zone>
       *
       *    <fixed-buttons>               ← frère de scroll-zone → fixed OK
       *    <drawer-overlay>              ← frère de scroll-zone → fixed OK
       *    <drawer-panel>                ← frère de scroll-zone → fixed OK
       *  </root>
       *
       * Règle : un élément position:fixed se positionne par rapport au premier
       * ancêtre ayant overflow≠visible, transform, filter ou will-change.
       * En isolant le scroll dans un enfant dédié, les fixed restent ancrés
       * à la viewport et non au scroll-zone.
       *)
      */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          /* Pas d'overflow ici — ne doit pas créer de containing block */
        }}
      >

        {/* ── Zone de scroll isolée ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div
            style={{
              height: `${canvasHeight}px`,
              width: '100%',
              minHeight: '100vh',
            }}
          >
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ── Boutons fixed — EN DEHORS de scroll-zone ── */}
        <div
          style={{
            position: 'fixed',
            right: '16px',
            top: '16px',
            zIndex: 9999,
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md transition"
            style={{
              background: ui.buttonBg,
              color: ui.buttonText,
              border: `1px solid ${ui.buttonBorder}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = ui.buttonBgHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ui.buttonBg }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-medium backdrop-blur-md transition"
            style={{
              background: ui.buttonBg,
              color: ui.buttonText,
              border: `1px solid ${ui.buttonBorder}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = ui.buttonBgHover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ui.buttonBg }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Détails
          </button>
        </div>

        {/* ── Drawer — EN DEHORS de scroll-zone ── */}
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                background: 'rgba(0,0,0,0.50)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Panel */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                zIndex: 9999,
                height: '100%',
                width: '384px',
                background: ui.panelBg,
                color: dark ? '#ffffff' : '#181818',
                borderLeft: `1px solid ${ui.panelBorder}`,
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
            >
              <div
                className="sticky top-0 flex items-center justify-between px-5 py-4"
                style={{
                  background: ui.panelBgSoft,
                  borderBottom: `1px solid ${ui.panelBorder}`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <h2 className="text-base font-semibold" style={{ color: dark ? '#ffffff' : '#181818' }}>
                  Détails du post
                </h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 transition"
                  style={{ color: dark ? 'rgba(255,255,255,.60)' : 'rgba(0,0,0,.55)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.05)'
                    e.currentTarget.style.color = dark ? '#ffffff' : '#181818'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = dark ? 'rgba(255,255,255,.60)' : 'rgba(0,0,0,.55)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 p-5">
                <DetailRow dark={dark} label="Titre">{post.title}</DetailRow>
                <DetailRow dark={dark} label="Slug">{post.slug}</DetailRow>

                {post.excerpt && (
                  <DetailRow dark={dark} label="Extrait">{post.excerpt}</DetailRow>
                )}

                {post.category && (
                  <DetailRow dark={dark} label="Catégorie">
                    <span
                      className="inline-flex rounded-md px-2 py-0.5 text-xs"
                      style={{
                        background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
                        color: dark ? 'rgba(255,255,255,.90)' : 'rgba(0,0,0,.80)',
                      }}
                    >
                      {post.category.name}
                    </span>
                  </DetailRow>
                )}

                {post.tags && post.tags.length > 0 && (
                  <DetailRow dark={dark} label="Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex rounded-md px-2 py-0.5 text-xs"
                          style={{
                            background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
                            color: dark ? 'rgba(255,255,255,.90)' : 'rgba(0,0,0,.80)',
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}

                <DetailRow dark={dark} label="Statut">
                  <StatusBadge dark={dark} status={post.status} />
                </DetailRow>

                {post.publishedAt && (
                  <DetailRow dark={dark} label="Publié le">
                    {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </DetailRow>
                )}

                <DetailRow dark={dark} label="Créé le">
                  {new Date(post.createdAt || '').toLocaleDateString('fr-FR')}
                </DetailRow>

                <DetailRow dark={dark} label="Modifié le">
                  {new Date(post.updatedAt || '').toLocaleDateString('fr-FR')}
                </DetailRow>

                {post.author && (
                  <DetailRow dark={dark} label="Auteur">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                        style={{
                          background: dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.06)',
                          color: dark ? '#ffffff' : '#181818',
                        }}
                      >
                        {post.author.email.charAt(0).toUpperCase()}
                      </div>
                      <span>{post.author.email}</span>
                    </div>
                  </DetailRow>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}