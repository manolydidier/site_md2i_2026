'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import grapesjs, { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'

type Product = {
  id: string
  name: string
  slug: string
  excerpt?: string | null
  price?: number | string | null
  coverImage?: string | null
  images?: unknown
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  gjsHtml?: string | null
  gjsJs?: string | null
  gjsStyles?: unknown
  gjsComponents?: unknown
  category?: {
    id: string
    name: string
    slug?: string | null
  } | null
}

type CanvasEventHandlers = {
  preventDrag: (e: Event) => boolean
  preventContextMenu: (e: Event) => boolean
  preventSelectStart: (e: Event) => void
  preventCopy: (e: Event) => boolean | void
  preventPaste: (e: Event) => boolean | void
  handleAnchorClick: (e: Event) => void
}

function getUiColors(dark: boolean) {
  return {
    buttonBg: dark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255,255,255,.92)',
    buttonBgHover: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,1)',
    buttonText: dark ? '#f8fafc' : '#18181b',
    buttonBorder: dark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
    buttonShadow: dark
      ? '0 14px 34px rgba(0,0,0,.38)'
      : '0 14px 34px rgba(15,23,42,.14)',
    panelBg: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255,255,255,.94)',
    panelBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
    panelText: dark ? '#f8fafc' : '#18181b',
    panelMuted: dark ? '#94a3b8' : '#6b7280',
    appBg: dark ? '#020617' : '#f8fafc',
    cardBg: dark ? '#0f172a' : '#ffffff',
    cardBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    mutedText: dark ? '#94a3b8' : '#6b7280',
    accent1: '#ef9f27',
    accent2: '#f7c060',
  }
}

function formatPrice(value: Product['price']) {
  if (value === null || value === undefined || value === '') {
    return 'Prix sur demande'
  }

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)

  return `${new Intl.NumberFormat('fr-FR').format(numeric)} Ar`
}

function formatDate(value?: string | null) {
  if (!value) return 'Non renseigné'

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function normalizeProductImages(images: unknown, coverImage?: string | null) {
  const urls: string[] = []

  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === 'string' && item.trim()) urls.push(item.trim())
    }
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim()) urls.push(item.trim())
        }
      } else {
        urls.push(images.trim())
      }
    } catch {
      urls.push(images.trim())
    }
  }

  if (coverImage && !urls.includes(coverImage)) {
    urls.unshift(coverImage)
  }

  return urls
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
          window.innerHeight,
        )
        setCanvasHeight(h)
      }
    }
  } catch (e) {
    console.warn('Error measuring height:', e)
  }
}

export default function ProductDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { dark } = useTheme()
  const slugOrId = params?.slugOrId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef = useRef<Editor | null>(null)
  const detailTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(900)
  const [detailVisible, setDetailVisible] = useState(true)

  const ui = useMemo(() => getUiColors(dark), [dark])
  const gallery = useMemo(
    () => normalizeProductImages(product?.images, product?.coverImage),
    [product?.images, product?.coverImage],
  )

  const hasGjsContent = Boolean(product?.gjsComponents || product?.gjsHtml)

  const clearDetailTimer = useCallback(() => {
    if (detailTimerRef.current) {
      window.clearTimeout(detailTimerRef.current)
      detailTimerRef.current = null
    }
  }, [])

  const startDetailAutoClose = useCallback(() => {
    clearDetailTimer()
    detailTimerRef.current = window.setTimeout(() => {
      setDetailVisible(false)
    }, 6000)
  }, [clearDetailTimer])

  useEffect(() => {
    if (!slugOrId) return

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await api.get<Product>(`/api/products/public/${slugOrId}`)
        const nextProduct = res.data

        setProduct(nextProduct)

        if (nextProduct?.slug && slugOrId !== nextProduct.slug) {
          router.replace(`/produits/${nextProduct.slug}`)
        }
      } catch (err) {
        console.error(err)
        setError('Impossible de charger ce produit.')
      } finally {
        setLoading(false)
      }
    })()
  }, [slugOrId, router])

  useEffect(() => {
    return () => clearDetailTimer()
  }, [clearDetailTimer])

  useEffect(() => {
    if (!product) return
    setDetailVisible(true)
    startDetailAutoClose()
  }, [product, startDetailAutoClose])

  useEffect(() => {
    if (!mountRef.current || !product || !hasGjsContent) return

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

      if (product.gjsComponents) {
        editor.setComponents(product.gjsComponents as any)
      } else if (product.gjsHtml) {
        editor.setComponents(product.gjsHtml)
      }

      if (product.gjsStyles) {
        editor.setStyle(product.gjsStyles as any)
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

          const handleAnchorClick = (e: Event) => {
            const target = e.target as HTMLElement | null
            const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
            if (!link) return

            e.preventDefault()
            e.stopPropagation()

            const href = link.getAttribute('href')
            if (!href) return

            const absoluteHref = new URL(href, window.location.origin).toString()
            const isDownload = link.hasAttribute('download')
            const downloadName = link.getAttribute('download') || ''
            const targetBlank = link.getAttribute('target') === '_blank'

            if (isDownload) {
              const tempLink = window.document.createElement('a')
              tempLink.href = absoluteHref
              tempLink.style.display = 'none'
              if (downloadName) tempLink.setAttribute('download', downloadName)
              tempLink.setAttribute('rel', 'noopener noreferrer')
              window.document.body.appendChild(tempLink)
              tempLink.click()
              tempLink.remove()
              return
            }

            if (targetBlank) {
              window.open(absoluteHref, '_blank', 'noopener,noreferrer')
              return
            }

            window.open(absoluteHref, '_blank', 'noopener,noreferrer')
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
          canvasDoc.body.addEventListener('click', handleAnchorClick, true)

          ;(editor as any).__eventHandlers = {
            preventDrag,
            preventContextMenu,
            preventSelectStart,
            preventCopy,
            preventPaste,
            handleAnchorClick,
          } satisfies CanvasEventHandlers

          if (product.gjsJs?.trim()) {
            const existing = canvasDoc.querySelector('script[data-product-js]')
            if (existing) existing.remove()

            const script = canvasDoc.createElement('script')
            script.setAttribute('data-product-js', 'true')
            script.text = product.gjsJs
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
            canvasDoc.body.removeEventListener('click', handlers.handleAnchorClick, true)
          }
        } catch {}

        currentEditor.destroy()
        gjsRef.current = null
      }
    }
  }, [product, dark, hasGjsContent])

  useEffect(() => {
    const editor = gjsRef.current
    if (!editor || !hasGjsContent) return

    syncEmbeddedTheme(editor, dark)

    setTimeout(() => {
      measureCanvasHeight(editor, setCanvasHeight)
    }, 120)
  }, [dark, hasGjsContent])

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/produits')
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: ui.appBg }}
      >
        <div className="text-sm" style={{ color: ui.mutedText }}>
          Chargement…
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
        style={{ background: ui.appBg }}
      >
        <p className="text-sm" style={{ color: ui.mutedText }}>
          {error || 'Produit introuvable.'}
        </p>

        <button
          onClick={goBack}
          style={{
            height: '44px',
            padding: '0 18px',
            borderRadius: '14px',
            border: 'none',
            background: `linear-gradient(135deg, ${ui.accent1} 0%, ${ui.accent2} 100%)`,
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 30px rgba(239,159,39,.30)',
          }}
        >
          Retour
        </button>
      </div>
    )
  }

  if (!hasGjsContent) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: ui.appBg,
          padding: '96px 20px 40px',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
          }}
        >
          <button
            onClick={goBack}
            aria-label="Retour"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              height: '46px',
              padding: '0 18px',
              borderRadius: '16px',
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonText,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: ui.buttonShadow,
              transition: 'all .22s ease',
              marginBottom: '24px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gallery.length ? 'minmax(0, 1.1fr) minmax(320px, .9fr)' : '1fr',
              gap: '24px',
            }}
          >
            {gallery.length > 0 && (
              <div
                style={{
                  background: ui.cardBg,
                  border: `1px solid ${ui.cardBorder}`,
                  borderRadius: '26px',
                  overflow: 'hidden',
                  boxShadow: ui.buttonShadow,
                }}
              >
                <img
                  src={gallery[0]}
                  alt={product.name}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    minHeight: '420px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            <div
              style={{
                background: ui.cardBg,
                border: `1px solid ${ui.cardBorder}`,
                borderRadius: '26px',
                padding: '28px',
                boxShadow: ui.buttonShadow,
              }}
            >
              {product.category?.name && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '28px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    background: 'rgba(239,159,39,.10)',
                    color: ui.accent1,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                  }}
                >
                  {product.category.name}
                </div>
              )}

              <h1
                style={{
                  margin: 0,
                  color: ui.panelText,
                  fontSize: 'clamp(30px, 4vw, 48px)',
                  lineHeight: 1.05,
                  letterSpacing: '-.04em',
                  fontWeight: 800,
                }}
              >
                {product.name}
              </h1>

              <div
                style={{
                  marginTop: '14px',
                  fontSize: '14px',
                  color: ui.panelMuted,
                  lineHeight: 1.8,
                }}
              >
                {product.excerpt?.trim() || 'Aucun extrait disponible.'}
              </div>

              <div
                style={{
                  marginTop: '24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    border: `1px solid ${ui.cardBorder}`,
                    borderRadius: '18px',
                    padding: '16px',
                    background: dark ? 'rgba(255,255,255,.03)' : 'rgba(15,23,42,.03)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: ui.panelMuted,
                      marginBottom: '8px',
                    }}
                  >
                    Prix
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: ui.accent1,
                      letterSpacing: '-.02em',
                    }}
                  >
                    {formatPrice(product.price)}
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${ui.cardBorder}`,
                    borderRadius: '18px',
                    padding: '16px',
                    background: dark ? 'rgba(255,255,255,.03)' : 'rgba(15,23,42,.03)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: ui.panelMuted,
                      marginBottom: '8px',
                    }}
                  >
                    Publication
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: ui.panelText,
                    }}
                  >
                    {formatDate(product.publishedAt || product.createdAt)}
                  </div>
                </div>
              </div>

              {gallery.length > 1 && (
                <div
                  style={{
                    marginTop: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {gallery.slice(1).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: `1px solid ${ui.cardBorder}`,
                        background: dark ? '#0b1220' : '#f8fafc',
                      }}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 2}`}
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

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

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          background: ui.appBg,
        }}
      >
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

        <div
          style={{
            position: 'fixed',
            top: '90px',
            left: '16px',
            zIndex: 9999,
          }}
        >
          <button
            onClick={goBack}
            aria-label="Retour"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              height: '46px',
              padding: '0 18px',
              borderRadius: '16px',
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonText,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              boxShadow: ui.buttonShadow,
              transition: 'all .22s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = ui.buttonBgHover
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ui.buttonBg
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Retour
          </button>
        </div>

        <div
          style={{
            position: 'fixed',
            top: '90px',
            right: '16px',
            zIndex: 9999,
          }}
        >
          {!detailVisible && (
            <button
              onClick={() => {
                setDetailVisible(true)
                startDetailAutoClose()
              }}
              aria-label="Afficher les détails"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                height: '46px',
                padding: '0 18px',
                borderRadius: '16px',
                border: `1px solid ${ui.buttonBorder}`,
                background: ui.buttonBg,
                color: ui.buttonText,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: ui.buttonShadow,
                transition: 'all .22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = ui.buttonBgHover
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = ui.buttonBg
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Afficher les détails
            </button>
          )}
        </div>

        {detailVisible && (
          <div
            style={{
              position: 'fixed',
              top: '90px',
              right: '16px',
              zIndex: 9999,
              maxWidth: '360px',
              width: 'calc(100vw - 32px)',
            }}
            onMouseEnter={clearDetailTimer}
            onMouseLeave={startDetailAutoClose}
          >
            <div
              style={{
                borderRadius: '20px',
                border: `1px solid ${ui.panelBorder}`,
                background: ui.panelBg,
                color: ui.panelText,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: ui.buttonShadow,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: ui.panelMuted,
                    }}
                  >
                    Détails produit
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '10px',
                      color: ui.panelMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    Fermeture automatique après 6 secondes
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDetailVisible(false)
                    clearDetailTimer()
                  }}
                  aria-label="Fermer les détails"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '12px',
                    border: `1px solid ${ui.panelBorder}`,
                    background: ui.buttonBg,
                    color: ui.buttonText,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all .18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = ui.buttonBgHover
                    e.currentTarget.style.transform = 'scale(1.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = ui.buttonBg
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {product.category?.name && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '24px',
                    padding: '0 10px',
                    borderRadius: '999px',
                    background: 'rgba(239,159,39,.10)',
                    color: ui.accent1,
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                  }}
                >
                  {product.category.name}
                </div>
              )}

              <div
                style={{
                  fontSize: '18px',
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: '-.03em',
                }}
              >
                {product.name}
              </div>

              {product.excerpt?.trim() && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    lineHeight: 1.65,
                    color: ui.panelMuted,
                  }}
                >
                  {product.excerpt}
                </div>
              )}

              <div
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: ui.accent1,
                    letterSpacing: '-.01em',
                  }}
                >
                  {formatPrice(product.price)}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: ui.panelMuted,
                    fontWeight: 600,
                  }}
                >
                  {formatDate(product.publishedAt || product.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}