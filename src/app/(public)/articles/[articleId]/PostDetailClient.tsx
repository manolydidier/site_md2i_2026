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
    if (!mountRef.current || !post) return
    
    // Nettoyer l'ancien éditeur s'il existe
    if (gjsRef.current) {
      gjsRef.current.destroy()
      gjsRef.current = null
    }

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
      // Désactiver l'édition
      editable: false,
      // Désactiver tous les composants interactifs
      components: {
        defaults: {
          editable: false,
          draggable: false,
          selectable: false,
          hoverable: false,
          highlightable: false,
          copyable: false,
          removable: false,
        }
      },
      // Désactiver les commandes d'édition
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
        ]
      },
      // Désactiver le drag and drop
      dragManager: {
        disable: true,
      },
      // Désactiver les sélecteurs
      selectorManager: {
        component: null,
      },
      // Désactiver les traits
      traitManager: {
        disable: true,
      },
      // Désactiver le style manager
      styleManager: {
        disable: true,
      },
      // Désactiver le layer manager
      layerManager: {
        disable: true,
      },
      // Désactiver le block manager
      blockManager: {
        disable: true,
      },
      // Désactiver le device manager
      deviceManager: {
        disable: true,
      },
      allowScripts: true,
    })

    gjsRef.current = editor

    // Désactiver la sélection de composants
    editor.on('component:selected', () => {
      editor.select(null)
    })

    // Désactiver le hover
    editor.on('component:mouseover', (component) => {
      editor.getHighlighter().remove()
    })

    // Désactiver tous les outils d'édition
    editor.on('load', () => {
      // Désactiver toutes les commandes
      const commands = editor.Commands.getAll()
      Object.keys(commands).forEach(cmdId => {
        if (cmdId.startsWith('core:')) {
          editor.Commands.add(cmdId, {
            run: () => {},
            stop: () => {},
          })
        }
      })

      // Charger le contenu
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

      // Désactiver tous les composants
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
          
          // Désactiver les composants enfants
          if (component.components && component.components().length > 0) {
            component.components().forEach((child: any) => disableComponent(child))
          }
        }
      }
      
      allComponents.forEach((component: any) => disableComponent(component))

      // Attendre que le canvas soit prêt
      const setupCanvas = () => {
        try {
          const canvasDoc = editor.Canvas?.getDocument()
          if (!canvasDoc) {
            setTimeout(setupCanvas, 50)
            return
          }

          // Ajouter les styles pour désactiver complètement l'interaction
          const style = canvasDoc.createElement('style')
          style.id = 'readonly-styles'
          style.innerHTML = `
            /* Désactiver la sélection de texte */
            * {
              user-select: none !important;
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              -webkit-user-drag: none !important;
              user-drag: none !important;
              -webkit-tap-highlight-color: transparent !important;
            }
            
            /* Désactiver le drag and drop */
            *:active,
            *:focus {
              outline: none !important;
            }
            
            /* Désactiver les curseurs d'édition */
            * {
              cursor: default !important;
            }
            
            /* Réactiver pour les éléments interactifs */
            a, button, [role="button"], input, select, textarea {
              user-select: text !important;
              -webkit-user-select: text !important;
              cursor: pointer !important;
            }
            
            /* Empêcher le drag des images */
            img, svg, canvas {
              pointer-events: none !important;
              user-select: none !important;
            }
            
            /* Désactiver les sélections */
            ::selection {
              background: transparent !important;
            }
            
            ::-moz-selection {
              background: transparent !important;
            }
            
            /* Désactiver les outlines */
            *:focus {
              outline: none !important;
            }
          `
          
          const oldStyle = canvasDoc.getElementById('readonly-styles')
          if (oldStyle) oldStyle.remove()
          canvasDoc.head.appendChild(style)

          // Empêcher tous les événements de drag
          const preventDrag = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }
          
          const preventContextMenu = (e: Event) => {
            e.preventDefault()
            return false
          }
          
          // Ajouter tous les écouteurs d'événements
          canvasDoc.body.addEventListener('dragstart', preventDrag)
          canvasDoc.body.addEventListener('drop', preventDrag)
          canvasDoc.body.addEventListener('dragenter', preventDrag)
          canvasDoc.body.addEventListener('dragover', preventDrag)
          canvasDoc.body.addEventListener('dragend', preventDrag)
          canvasDoc.body.addEventListener('contextmenu', preventContextMenu)
          
          // Empêcher la sélection de texte
          canvasDoc.body.addEventListener('selectstart', (e) => {
            const target = e.target as HTMLElement
            // Permettre la sélection uniquement dans les champs de formulaire
            if (!target.closest('input') && !target.closest('textarea') && !target.closest('[contenteditable="true"]')) {
              e.preventDefault()
            }
          })
          
          // Empêcher la copie
          canvasDoc.body.addEventListener('copy', (e) => {
            const target = e.target as HTMLElement
            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          })
          
          // Empêcher le collage
          canvasDoc.body.addEventListener('paste', (e) => {
            const target = e.target as HTMLElement
            if (!target.closest('input') && !target.closest('textarea')) {
              e.preventDefault()
              return false
            }
          })
          
          // Stocker les fonctions de nettoyage
          ;(editor as any).__eventHandlers = {
            preventDrag,
            preventContextMenu,
          }

          // Exécuter le JS personnalisé
          if (post.gjsJs?.trim()) {
            const existing = canvasDoc.querySelector('script[data-post-js]')
            if (existing) existing.remove()
            
            const script = canvasDoc.createElement('script')
            script.setAttribute('data-post-js', 'true')
            script.text = post.gjsJs
            canvasDoc.body.appendChild(script)
          }

          // Mesurer la hauteur
          setTimeout(() => {
            try {
              const iframeEl = editor.Canvas.getFrameEl()
              if (iframeEl?.contentDocument) {
                const body = iframeEl.contentDocument.body
                const html = iframeEl.contentDocument.documentElement
                if (body && html) {
                  const h = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight, 900)
                  setCanvasHeight(h)
                }
              }
            } catch (e) {
              console.warn('Error measuring height:', e)
            }
          }, 200)
          
        } catch (e) {
          console.warn('Error setting up canvas:', e)
        }
      }

      setupCanvas()
      
      // Passer en mode preview
      editor.runCommand('preview')
    })

    return () => {
      // Nettoyer
      if (gjsRef.current) {
        const editor = gjsRef.current
        try {
          const canvasDoc = editor.Canvas?.getDocument()
          if (canvasDoc && (editor as any).__eventHandlers) {
            const handlers = (editor as any).__eventHandlers
            canvasDoc.body.removeEventListener('dragstart', handlers.preventDrag)
            canvasDoc.body.removeEventListener('drop', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragenter', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragover', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragend', handlers.preventDrag)
            canvasDoc.body.removeEventListener('contextmenu', handlers.preventContextMenu)
          }
        } catch (e) {
          // Ignorer les erreurs de nettoyage
        }
        editor.destroy()
        gjsRef.current = null
      }
    }
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

        /* Cacher tous les éléments d'édition de GrapesJS */
        .gjs-pn-panel,
        .gjs-pn-panels,
        [class*="gjs-pn-"],
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
          overflow: hidden !important;
        }

        .gjs-cv-canvas__frames {
          pointer-events: none;
        }
        
        .gjs-cv-canvas__frames iframe {
          pointer-events: auto !important;
        }

        .gjs-editor {
          background: transparent !important;
          border: none !important;
        }

        html, body {
          background: transparent !important;
        }

        /* Désactiver tout élément interactif de l'éditeur */
        .gjs-cv-canvas * {
          pointer-events: none !important;
        }
        
        .gjs-cv-canvas__frames iframe * {
          pointer-events: auto !important;
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
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-[#0a0a1f] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0a0a1f]/95 px-5 py-4 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-white">Détails du post</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6 p-5">
              <DetailRow label="Titre">{post.title}</DetailRow>
              <DetailRow label="Slug">{post.slug}</DetailRow>
              {post.excerpt && <DetailRow label="Extrait">{post.excerpt}</DetailRow>}
              {post.category && (
                <DetailRow label="Catégorie">
                  <span className="inline-flex rounded-md bg-white/5 px-2 py-0.5 text-xs">
                    {post.category.name}
                  </span>
                </DetailRow>
              )}
              {post.tags && post.tags.length > 0 && (
                <DetailRow label="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map(({ tag }) => (
                      <span key={tag.id} className="inline-flex rounded-md bg-white/5 px-2 py-0.5 text-xs">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}
              <DetailRow label="Statut">
                <StatusBadge status={post.status} />
              </DetailRow>
              {post.publishedAt && (
                <DetailRow label="Publié le">
                  {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </DetailRow>
              )}
              <DetailRow label="Créé le">
                {new Date(post.createdAt || '').toLocaleDateString('fr-FR')}
              </DetailRow>
              <DetailRow label="Modifié le">
                {new Date(post.updatedAt || '').toLocaleDateString('fr-FR')}
              </DetailRow>
              {post.author && (
                <DetailRow label="Auteur">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
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
    </>
  )
}