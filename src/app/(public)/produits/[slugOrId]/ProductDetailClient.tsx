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

type EditorWithOptionalHighlighter = Editor & {
  getHighlighter?: () => {
    remove: () => void
  }
}

function getUiColors(dark: boolean) {
  return {
    buttonBg: dark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.96)',
    buttonBgHover: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 1)',
    buttonText: dark ? '#fff7ed' : '#111827',
    buttonBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',
    buttonShadow: dark
      ? '0 24px 70px rgba(0,0,0,.42)'
      : '0 24px 70px rgba(15,23,42,.10)',

    panelBg: dark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.94)',
    panelBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',
    panelText: dark ? '#fff7ed' : '#111827',
    panelMuted: dark ? '#d8c3ab' : '#475569',

    appBg: dark ? '#020617' : '#f8fafc',

    pageBg: dark
      ? 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.18), transparent 28rem), radial-gradient(circle at 88% 12%, rgba(255,190,107,.10), transparent 32rem), linear-gradient(180deg, #020617 0%, #07101f 42%, #020617 100%)'
      : 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.10), transparent 26rem), radial-gradient(circle at 88% 12%, rgba(15,23,42,.04), transparent 30rem), linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #ffffff 100%)',

    cardBg: dark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.96)',
    cardBorder: dark ? 'rgba(255, 226, 194, 0.13)' : 'rgba(15, 23, 42, 0.08)',

    mutedText: dark ? '#d8c3ab' : '#64748b',

    accent1: '#ef9f27',
    accent2: '#f7c060',
    accent3: '#d9791f',

    neutral1: dark ? '#ead7c0' : '#64748b',
    neutral2: dark ? '#94a3b8' : '#475569',

    text: dark ? '#fff7ed' : '#0f172a',
    textSoft: dark ? 'rgba(255,247,237,.76)' : 'rgba(15,23,42,.72)',
    textMuted: dark ? 'rgba(255,247,237,.52)' : 'rgba(15,23,42,.48)',

    line: dark ? 'rgba(255,226,194,.13)' : 'rgba(15,23,42,.08)',

    orangeSoft: dark ? 'rgba(239,159,39,.17)' : 'rgba(239,159,39,.08)',
    orangeBorder: dark ? 'rgba(247,192,96,.36)' : 'rgba(239,159,39,.28)',

    glassBg: dark
      ? 'linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.045))'
      : 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.84))',

    glassBorder: dark ? 'rgba(255,226,194,.14)' : 'rgba(15,23,42,.08)',
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

  const productPageRootSelector =
    ':where(.project-theme, .md2i-support, .sara-page, [data-theme], [id$="-page"], body > div:first-child, body > main:first-child)'
  const productPageRootQuery =
    '.project-theme, .md2i-support, .sara-page, [data-theme], [id$="-page"], body > div:first-child, body > main:first-child'
  const theme = dark ? 'dark' : 'light'
  const pageText = dark ? '#fff7ed' : '#20130a'
  const softText = dark ? '#d8c3ab' : '#75563a'
  const accent1 = '#ef9f27'
  const accent2 = '#f7c060'
  const line = dark ? 'rgba(255,226,194,.13)' : 'rgba(118,77,38,.13)'
  const glass = dark
    ? 'linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.045))'
    : 'linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,244,229,.62))'
  const pageBackground = dark
    ? 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.18), transparent 28rem), radial-gradient(circle at 88% 12%, rgba(255,190,107,.10), transparent 32rem), linear-gradient(180deg, #020617 0%, #07101f 42%, #020617 100%)'
    : 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.18), transparent 28rem), radial-gradient(circle at 88% 12%, rgba(122,92,62,.10), transparent 32rem), linear-gradient(180deg, #fff8ee 0%, #ffffff 46%, #f8fafc 100%)'

  let baseStyle = canvasDoc.getElementById(
    'viewer-base-style',
  ) as HTMLStyleElement | null

  if (!baseStyle) {
    baseStyle = canvasDoc.createElement('style')
    baseStyle.id = 'viewer-base-style'
    canvasDoc.head.appendChild(baseStyle)
  }

  baseStyle.innerHTML = `
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${pageBackground} !important;
      color: ${pageText} !important;
      overflow-x: hidden !important;
    }

    html[data-app-theme="${theme}"],
    body[data-app-theme="${theme}"] {
      color-scheme: ${dark ? 'dark' : 'light'};
    }

    ${productPageRootSelector} {
      background: ${pageBackground} !important;
      color: ${pageText} !important;
      min-height: 100% !important;
    }

    ${productPageRootSelector}[data-theme="${theme}"] {
      background: ${pageBackground} !important;
      color: ${pageText} !important;
    }

    ${productPageRootSelector} :where(h1, h2, h3, h4, strong) {
      color: ${pageText};
    }

    ${productPageRootSelector} :where(p, span, li) {
      border-color: ${line};
    }

    ${productPageRootSelector} p {
      color: ${softText};
    }

    ${productPageRootSelector} :where(.glass, .card, .panel, .tabs) {
      background: ${glass};
      border-color: ${line};
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
    }

    ${productPageRootSelector} :where(button, a) {
      -webkit-tap-highlight-color: transparent;
    }

    ${productPageRootSelector} :where(.primary, .active, [data-active="true"]) {
      border-color: rgba(239,159,39,.34);
    }

    ${productPageRootSelector} .accent {
      color: ${accent1};
    }

    ${productPageRootSelector} .orange-gradient {
      background: linear-gradient(135deg, ${accent1}, ${accent2});
    }
  `

  canvasDoc.documentElement.setAttribute('data-app-theme', theme)
  canvasDoc.body.setAttribute('data-app-theme', theme)

  const themeRoot = canvasDoc.querySelector(
    productPageRootQuery,
  ) as HTMLElement | null

  if (themeRoot) {
    themeRoot.setAttribute('data-theme', theme)
    themeRoot.style.background = pageBackground
    themeRoot.style.color = pageText
    themeRoot.style.minHeight = '100%'
  }

  const wrapper = editor.getWrapper() as GrapesStyleReceiver | null

  if (wrapper) {
    wrapper.addStyle({
      background: pageBackground,
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
      allowScripts: Boolean(product.gjsJs?.trim()),
    } as unknown as Parameters<typeof grapesjs.init>[0])

    gjsRef.current = editor

    editor.on('component:selected', () => {
      editor.select(undefined)
    })

    editor.on('component:mouseover', () => {
      ;(editor as EditorWithOptionalHighlighter).getHighlighter?.().remove()
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

      ;(allComponents as unknown as {
        forEach: (callback: (component: unknown) => void) => void
      }).forEach((component) =>
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
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
        }

        .product-detail-page::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -2;
          pointer-events: none;
          opacity: ${dark ? '.18' : '.16'};
          background-image:
            linear-gradient(${dark ? 'rgba(255,226,194,.08)' : 'rgba(118,77,38,.08)'} 1px, transparent 1px),
            linear-gradient(90deg, ${dark ? 'rgba(255,226,194,.08)' : 'rgba(118,77,38,.08)'} 1px, transparent 1px);
          background-size: 92px 92px;
          mask-image: radial-gradient(circle at 50% 12%, #000 0, transparent 72%);
        }

        .product-detail-page::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: -3;
          pointer-events: none;
          opacity: ${dark ? '.20' : '.12'};
          background:
            radial-gradient(circle at 16% 10%, rgba(239,159,39,.20), transparent 30rem),
            radial-gradient(circle at 86% 18%, ${dark ? 'rgba(247,192,96,.12)' : 'rgba(122,92,62,.10)'}, transparent 34rem);
        }

        .product-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
        }

        .product-hero::before {
          content: '';
          position: absolute;
          right: -14%;
          top: 10%;
          z-index: -1;
          width: min(58vw, 760px);
          aspect-ratio: 1;
          opacity: ${dark ? '.42' : '.34'};
          background: rgba(239,159,39,.22);
          filter: blur(4px);
          clip-path: polygon(46% 0, 86% 13%, 100% 51%, 71% 92%, 24% 100%, 0 62%, 12% 18%);
          animation: productMorph 16s ease-in-out infinite alternate;
        }

        @keyframes productMorph {
          0% {
            clip-path: polygon(46% 0, 86% 13%, 100% 51%, 71% 92%, 24% 100%, 0 62%, 12% 18%);
            transform: translate3d(0, 0, 0) rotate(0deg);
          }

          100% {
            clip-path: polygon(58% 3%, 100% 30%, 82% 82%, 48% 100%, 8% 76%, 0 29%, 25% 7%);
            transform: translate3d(-4%, 3%, 0) rotate(8deg);
          }
        }

        .product-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -3;
          background: ${dark ? '#020617' : '#fff8ee'};
        }

        .product-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(${dark ? '1.02' : '1.06'}) contrast(1.05);
          opacity: ${dark ? '.74' : '.86'};
        }

        .product-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              ${dark ? 'rgba(2,6,23,.92)' : 'rgba(32,19,10,.72)'},
              ${dark ? 'rgba(2,6,23,.66)' : 'rgba(32,19,10,.44)'},
              ${dark ? 'rgba(2,6,23,.22)' : 'rgba(32,19,10,.10)'}
            ),
            linear-gradient(
              180deg,
              ${dark ? 'rgba(2,6,23,.14)' : 'rgba(255,248,238,.06)'},
              ${dark ? 'rgba(2,6,23,.94)' : 'rgba(255,248,238,.92)'}
            );
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
          color: ${ui.accent2};
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
          border: 1px solid rgba(247,192,96,.42);
          color: #fff;
          text-transform: uppercase;
          box-shadow: 0 0 34px rgba(239,159,39,.16);
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
          color: #fff;
          text-shadow: 0 18px 42px rgba(0,0,0,.28);
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
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            background .18s ease,
            border-color .18s ease;
        }

        .primary-action {
          border: none;
          background: linear-gradient(135deg, ${ui.accent1}, ${ui.accent2});
          color: ${dark ? '#1d0d03' : '#fff'};
          box-shadow:
            0 14px 30px rgba(239,159,39,.30),
            inset 0 1px 0 rgba(255,255,255,.28);
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

        .primary-action:hover {
          box-shadow:
            0 18px 42px rgba(239,159,39,.38),
            inset 0 1px 0 rgba(255,255,255,.34);
        }

        .secondary-action:hover {
          background: rgba(255,255,255,.18);
          border-color: rgba(247,192,96,.30);
        }

        .product-summary-card {
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.16);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 26px 90px rgba(0,0,0,.28);
          position: relative;
          overflow: hidden;
        }

        .product-summary-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          pointer-events: none;
          opacity: .7;
          background:
            radial-gradient(circle at 18% 0%, rgba(239,159,39,.24), transparent 32%),
            linear-gradient(135deg, rgba(255,255,255,.14), transparent 58%);
        }

        .product-summary-card > * {
          position: relative;
        }

        .summary-eyebrow {
          display: block;
          margin-bottom: 12px;
          color: ${ui.accent2};
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
          color: #fff;
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
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
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
          background: ${dark
            ? 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.12), transparent 28rem), #020617'
            : 'radial-gradient(circle at 12% 8%, rgba(239,159,39,.10), transparent 28rem), #fffaf3'};
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
          background: ${dark ? '#0b1220' : '#fffaf3'};
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
            ${dark ? '#0f172a' : '#20130a'};
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
          color: ${dark ? '#1d0d03' : '#fff'};
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
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
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
          color: ${dark ? '#1d0d03' : '#fff'};
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

      <main className="product-detail-page" data-theme={dark ? 'dark' : 'light'}>
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
                <div className="product-builder-shell" data-theme={dark ? 'dark' : 'light'}>
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
