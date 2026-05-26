'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import api from '@/app/lib/axios'
import { useTheme } from '@/app/context/ThemeContext'
import {
  translateDynamicItems,
  translateGrapesComponents,
  translateHtmlContent,
} from '@/app/i18n/dynamic'
import { type Locale, normalizeLocale } from '@/app/i18n/settings'
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

type GrapesComponentInput = Parameters<Editor['setComponents']>[0]
type GrapesStyleInput = Parameters<Editor['setStyle']>[0]

type GrapesComponentNode = {
  set: (key: string, value: unknown) => void
  components?: () => {
    length: number
    forEach: (callback: (component: GrapesComponentNode) => void) => void
  }
}

type GrapesStyleReceiver = {
  addStyle: (style: Record<string, string>) => void
}

type EditorWithEventHandlers = Editor & {
  __eventHandlers?: CanvasEventHandlers
}

function getUiColors(dark: boolean) {
  return {
    buttonBg: dark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255,255,255,.92)',
    buttonBgHover: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255,255,255,1)',
    buttonText: dark ? '#f8fafc' : '#18181b',
    buttonBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    buttonShadow: dark
      ? '0 14px 34px rgba(0,0,0,.38)'
      : '0 14px 34px rgba(15,23,42,.14)',
    panelBg: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255,255,255,.94)',
    panelBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    panelText: dark ? '#f8fafc' : '#18181b',
    panelMuted: dark ? '#94a3b8' : '#6b7280',
    appBg: dark ? '#020617' : '#f8fafc',
    pageBg: dark
      ? 'radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%), linear-gradient(180deg, #020617 0%, #080b13 42%, #020617 100%)'
      : 'radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%), linear-gradient(180deg, #fffaf3 0%, #ffffff 44%, #f8fafc 100%)',
    cardBg: dark ? 'rgba(15,23,42,.94)' : 'rgba(255,255,255,.96)',
    cardBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    mutedText: dark ? '#94a3b8' : '#6b7280',
    accent1: '#ef9f27',
    accent2: '#f7c060',
    text: dark ? '#f8fafc' : '#18181b',
    textSoft: dark ? 'rgba(248,250,252,.72)' : 'rgba(24,24,27,.72)',
    textMuted: dark ? 'rgba(248,250,252,.46)' : 'rgba(24,24,27,.46)',
    line: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    orangeSoft: dark ? 'rgba(239,159,39,.16)' : 'rgba(239,159,39,.10)',
    orangeBorder: 'rgba(239,159,39,.34)',
  }
}

function formatPrice(value: Product['price'], locale: Locale) {
  if (value === null || value === undefined || value === '') {
    return locale === 'en' ? 'Price on request' : 'Prix sur demande'
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) return String(value)

  return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(
    numeric,
  )} Ar`
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return locale === 'en' ? 'Not specified' : 'Non renseigné'

  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getProductLeadHref(product: Product) {
  const identifier = product.slug || product.id
  return `/produits/${encodeURIComponent(identifier)}/lead`
}

function normalizeProductImages(images: unknown, coverImage?: string | null) {
  const urls: string[] = []

  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === 'string' && item.trim()) {
        urls.push(item.trim())
      }
    }
  } else if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images)

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim()) {
            urls.push(item.trim())
          }
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

function safeImage(src?: string | null) {
  return src?.trim() || '/placeholder-reference.svg'
}

function syncEmbeddedTheme(editor: Editor, dark: boolean) {
  const canvasDoc = editor.Canvas?.getDocument()

  if (!canvasDoc) return

  const theme = dark ? 'dark' : 'light'
  const pageBg = dark ? '#020617' : '#ffffff'
  const pageText = dark ? '#f5f7fb' : '#181818'

  let baseStyle = canvasDoc.getElementById(
    'viewer-base-style',
  ) as HTMLStyleElement | null

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
      overflow-x: hidden !important;
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

  const wrapper = editor.getWrapper() as GrapesStyleReceiver | null

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

function measureCanvasHeight(
  editor: Editor,
  setCanvasHeight: (height: number) => void,
) {
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
          720,
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
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language)
  const slugOrId = params?.slugOrId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef = useRef<Editor | null>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(900)

  const ui = useMemo(() => getUiColors(dark), [dark])

  const gallery = useMemo(
    () => normalizeProductImages(product?.images, product?.coverImage),
    [product?.images, product?.coverImage],
  )

  const hasGjsContent = Boolean(product?.gjsComponents || product?.gjsHtml)
  const leadHref = product ? getProductLeadHref(product) : '#'
  const heroImage = safeImage(gallery[0] || product?.coverImage)

  useEffect(() => {
    if (!slugOrId) return

    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await api.get<Product>(`/api/products/public/${slugOrId}`)
        const nextProduct = res.data

        const [translatedProduct] = await translateDynamicItems<Product>(
          [nextProduct],
          locale,
          ['name', 'excerpt', 'category.name'],
        )

        const localizedProduct = translatedProduct ?? nextProduct

        const [translatedComponents, translatedHtml] = await Promise.all([
          localizedProduct.gjsComponents
            ? translateGrapesComponents(localizedProduct.gjsComponents, locale)
            : Promise.resolve(localizedProduct.gjsComponents),
          !localizedProduct.gjsComponents && localizedProduct.gjsHtml
            ? translateHtmlContent(localizedProduct.gjsHtml, locale)
            : Promise.resolve(localizedProduct.gjsHtml),
        ])

        if (cancelled) return

        setProduct({
          ...localizedProduct,
          gjsComponents: translatedComponents,
          gjsHtml: translatedHtml,
        })

        if (nextProduct?.slug && slugOrId !== nextProduct.slug) {
          router.replace(`/produits/${nextProduct.slug}`)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(t('productsPage.errors.load'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [slugOrId, router, locale, t])

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
      panels: {
        defaults: [],
      },
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
      dragManager: {
        disable: true,
      },
      selectorManager: {
        disable: true,
      },
      traitManager: {
        disable: true,
      },
      styleManager: {
        disable: true,
      },
      layerManager: {
        disable: true,
      },
      blockManager: {
        disable: true,
      },
      deviceManager: {
        disable: true,
      },
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
        editor.setComponents(product.gjsComponents as GrapesComponentInput)
      } else if (product.gjsHtml) {
        editor.setComponents(product.gjsHtml)
      }

      if (product.gjsStyles) {
        editor.setStyle(product.gjsStyles as GrapesStyleInput)
      }

      const allComponents = editor.getComponents()

      const disableComponent = (component: GrapesComponentNode) => {
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
            component.components().forEach((child) =>
              disableComponent(child),
            )
          }
        }
      }

      allComponents.forEach((component) =>
        disableComponent(component as unknown as GrapesComponentNode),
      )

      const setupCanvas = () => {
        try {
          const canvasDoc = editor.Canvas?.getDocument()

          if (!canvasDoc) {
            setTimeout(setupCanvas, 50)
            return
          }

          let readonlyStyle = canvasDoc.getElementById(
            'readonly-styles',
          ) as HTMLStyleElement | null

          if (!readonlyStyle) {
            readonlyStyle = canvasDoc.createElement('style')
            readonlyStyle.id = 'readonly-styles'
            canvasDoc.head.appendChild(readonlyStyle)
          }

          readonlyStyle.innerHTML = `
            * {
              -webkit-tap-highlight-color: transparent !important;
            }

            *:active,
            *:focus {
              outline: none !important;
            }

            img,
            svg,
            canvas {
              -webkit-user-drag: none !important;
              user-drag: none !important;
            }

            a,
            button,
            [role="button"] {
              cursor: pointer !important;
            }
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

              if (downloadName) {
                tempLink.setAttribute('download', downloadName)
              }

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

          ;(editor as EditorWithEventHandlers).__eventHandlers = {
            preventDrag,
            preventContextMenu,
            preventSelectStart,
            preventCopy,
            preventPaste,
            handleAnchorClick,
          } satisfies CanvasEventHandlers

          if (product.gjsJs?.trim()) {
            const existing = canvasDoc.querySelector('script[data-product-js]')

            if (existing) {
              existing.remove()
            }

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
          const handlers = (currentEditor as EditorWithEventHandlers)
            .__eventHandlers

          if (canvasDoc && handlers) {
            canvasDoc.body.removeEventListener(
              'dragstart',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener('drop', handlers.preventDrag)
            canvasDoc.body.removeEventListener(
              'dragenter',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'dragover',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'dragend',
              handlers.preventDrag,
            )
            canvasDoc.body.removeEventListener(
              'contextmenu',
              handlers.preventContextMenu,
            )
            canvasDoc.body.removeEventListener(
              'selectstart',
              handlers.preventSelectStart,
            )
            canvasDoc.body.removeEventListener('copy', handlers.preventCopy)
            canvasDoc.body.removeEventListener('paste', handlers.preventPaste)
            canvasDoc.body.removeEventListener(
              'click',
              handlers.handleAnchorClick,
              true,
            )
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
        className="product-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="product-state-card">{t('productDetail.loading')}</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div
        className="product-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="product-state-card">
          <p>{error || t('productDetail.notFound')}</p>

          <button onClick={goBack}>{t('productDetail.back')}</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

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

        .product-detail-page {
          min-height: 100vh;
          background: ${ui.pageBg};
          color: ${ui.text};
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .product-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
        }

        .product-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background: #020617;
        }

        .product-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.04) contrast(1.04);
        }

        .product-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(2,6,23,.86), rgba(2,6,23,.54), rgba(2,6,23,.20)),
            linear-gradient(180deg, rgba(2,6,23,.10), rgba(2,6,23,.88));
        }

        .product-hero-inner {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 138px 0 72px;
          color: #fff;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 34px;
          color: rgba(255,255,255,.68);
          font-size: 13px;
          font-weight: 650;
        }

        .breadcrumb a {
          color: rgba(255,255,255,.78);
          text-decoration: none;
          transition: color .18s ease;
        }

        .breadcrumb a:hover {
          color: ${ui.accent1};
        }

        .breadcrumb strong {
          max-width: 560px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.94);
          font-weight: 800;
        }

        .product-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 34px;
          align-items: end;
        }

        .product-hero-copy {
          max-width: 840px;
        }

        .product-kicker-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .product-kicker,
        .product-chip {
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .product-kicker {
          background: rgba(239,159,39,.24);
          border: 1px solid rgba(239,159,39,.42);
          color: #fff;
          text-transform: uppercase;
        }

        .product-chip {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          color: rgba(255,255,255,.88);
        }

        .product-hero h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 78px);
          line-height: .96;
          letter-spacing: -.065em;
          font-weight: 950;
        }

        .product-lead {
          margin: 24px 0 0;
          max-width: 760px;
          color: rgba(255,255,255,.78);
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.75;
          font-weight: 550;
        }

        .product-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .primary-action,
        .secondary-action {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 14px;
          font-weight: 850;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .primary-action {
          border: none;
          background: linear-gradient(135deg, ${ui.accent1}, ${ui.accent2});
          color: #fff;
          box-shadow: 0 14px 30px rgba(239,159,39,.30);
        }

        .secondary-action {
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.12);
          color: #fff;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-2px);
        }

        .product-summary-card {
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: 0 26px 90px rgba(0,0,0,.28);
        }

        .summary-eyebrow {
          display: block;
          margin-bottom: 12px;
          color: ${ui.accent1};
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .summary-title {
          display: grid;
          gap: 4px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,.12);
        }

        .summary-title strong {
          font-size: 18px;
          line-height: 1.25;
        }

        .summary-title span {
          color: rgba(255,255,255,.62);
          font-size: 14px;
        }

        .summary-list {
          display: grid;
          gap: 12px;
        }

        .summary-item {
          display: grid;
          gap: 4px;
        }

        .summary-item span {
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .summary-item strong {
          color: #fff;
          font-size: 14px;
          line-height: 1.4;
        }

        .product-body {
          width: 100%;
          margin: 0;
          padding: 0px 0 0;
        }

        .product-full-content {
          width: 100%;
        }

        .product-content-card {
          width: 100%;
          overflow: hidden;
          background: ${ui.cardBg};
          border-top: 1px solid ${ui.cardBorder};
          border-bottom: 1px solid ${ui.cardBorder};
          box-shadow: ${ui.buttonShadow};
        }

        .product-content-head {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: clamp(24px, 4vw, 42px) 0;
        }

        .section-title {
          margin-bottom: 18px;
        }

        .section-title span {
          display: block;
          margin-bottom: 8px;
          color: ${ui.accent1};
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .section-title h2 {
          margin: 0;
          font-size: clamp(26px, 3vw, 40px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 950;
          color: ${ui.text};
        }

        .product-content-head p {
          max-width: 760px;
          margin: 0;
          color: ${ui.textSoft};
          font-size: 15px;
          line-height: 1.8;
        }

        .product-builder-shell {
          width: 100%;
          min-height: 720px;
          background: ${dark ? '#020617' : '#ffffff'};
          border-top: 1px solid ${ui.line};
        }

        .product-builder-canvas {
          width: 100%;
        }

        .product-no-builder {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: clamp(24px, 4vw, 42px) 0;
          display: grid;
          gap: 18px;
        }

        .product-gallery-section {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 38px 0 0;
        }

        .product-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }

        .product-gallery-item {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid ${ui.cardBorder};
          background: ${dark ? '#0b1220' : '#f8fafc'};
          box-shadow: ${ui.buttonShadow};
        }

        .product-gallery-item img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }

        .product-bottom-cta-wrap {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 34px 0 84px;
        }

        .product-bottom-cta {
          border-radius: 26px;
          padding: clamp(24px, 4vw, 34px);
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.24), transparent 42%),
            ${dark ? '#0f172a' : '#111827'};
          border: 1px solid rgba(255,255,255,.10);
          color: #fff;
          box-shadow: ${ui.buttonShadow};
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 20px;
          align-items: center;
        }

        .product-bottom-cta h3 {
          margin: 0 0 8px;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.05;
          letter-spacing: -.04em;
          font-weight: 950;
        }

        .product-bottom-cta p {
          margin: 0;
          max-width: 760px;
          color: rgba(255,255,255,.70);
          line-height: 1.7;
          font-size: 15px;
        }

        .product-bottom-cta a {
          min-height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, ${ui.accent1}, ${ui.accent2});
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 14px 30px rgba(239,159,39,.28);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .product-bottom-cta a:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 38px rgba(239,159,39,.34);
        }

        .product-state-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .product-state-card {
          width: min(460px, 100%);
          padding: 28px;
          border-radius: 24px;
          background: ${ui.cardBg};
          border: 1px solid ${ui.cardBorder};
          box-shadow: ${ui.buttonShadow};
          color: ${ui.textSoft};
          text-align: center;
          font-size: 14px;
        }

        .product-state-card p {
          margin: 0 0 18px;
        }

        .product-state-card button {
          height: 44px;
          padding: 0 18px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, ${ui.accent1}, ${ui.accent2});
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(239,159,39,.30);
        }

        @media (max-width: 980px) {
          .product-hero {
            min-height: auto;
          }

          .product-hero-inner {
            padding: 128px 0 46px;
          }

          .product-hero-grid {
            grid-template-columns: 1fr;
          }

          .product-bottom-cta {
            grid-template-columns: 1fr;
          }

          .product-bottom-cta a {
            width: fit-content;
          }
        }

        @media (max-width: 640px) {
          .product-hero-inner,
          .product-content-head,
          .product-no-builder,
          .product-gallery-section,
          .product-bottom-cta-wrap {
            width: min(100% - 28px, 1180px);
          }

          .product-hero h1 {
            font-size: 40px;
          }

          .product-actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action,
          .product-bottom-cta a {
            width: 100%;
          }

          .product-bottom-cta {
            border-radius: 22px;
          }

          .breadcrumb strong {
            max-width: 260px;
          }
        }
      `}</style>

      <main className="product-detail-page">
        <section className="product-hero">
          <div className="product-hero-bg">
            <img src={heroImage} alt="" />
            <div className="product-hero-overlay" />
          </div>

          <div className="product-hero-inner">
            <nav className="breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span>/</span>
              <Link href="/produits">Produits</Link>
              <span>/</span>
              <strong>{product.name}</strong>
            </nav>

            <div className="product-hero-grid">
              <div className="product-hero-copy">
                <div className="product-kicker-row">
                  <span className="product-kicker">Produit MD2I</span>

                  {product.category?.name && (
                    <span className="product-chip">{product.category.name}</span>
                  )}

                  <span className="product-chip">
                    {formatPrice(product.price, locale)}
                  </span>
                </div>

                <h1>{product.name}</h1>

                <p className="product-lead">
                  {product.excerpt?.trim() || t('productsPage.card.noDescription')}
                </p>

                <div className="product-actions">
                  <Link href={leadHref} className="primary-action">
                    {t('productDetail.requestQuote')}
                  </Link>

                  <Link href="/produits" className="secondary-action">
                    {t('productDetail.viewAllProducts')}
                  </Link>
                </div>
              </div>

              <aside className="product-summary-card">
                <span className="summary-eyebrow">Fiche produit</span>

                <div className="summary-title">
                  <strong>{product.name}</strong>
                  <span>{product.category?.name || 'Catalogue MD2I'}</span>
                </div>

                <div className="summary-list">
                  <div className="summary-item">
                    <span>Prix</span>
                    <strong>{formatPrice(product.price, locale)}</strong>
                  </div>

                  <div className="summary-item">
                    <span>Publication</span>
                    <strong>
                      {formatDate(product.publishedAt || product.createdAt, locale)}
                    </strong>
                  </div>

                  <div className="summary-item">
                    <span>Référence</span>
                    <strong>{product.slug || product.id}</strong>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="product-body">
          <div className="product-full-content">
            <article className="product-content-card">
              {hasGjsContent ? (
                <div className="product-builder-shell">
                  <div
                    className="product-builder-canvas"
                    style={{
                      height: `${canvasHeight}px`,
                      minHeight: '720px',
                    }}
                  >
                    <div
                      ref={mountRef}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="product-no-builder">
                  <p style={{ color: ui.textSoft, lineHeight: 1.8 }}>
                    {product.excerpt?.trim() || t('productsPage.card.noDescription')}
                  </p>
                </div>
              )}
            </article>
          </div>
        </section>
      </main>
    </>
  )
}
