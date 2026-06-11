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
import { normalizeLocale } from '@/app/i18n/settings'
import grapesjs, { Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'

type Post = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  gjsHtml?: string | null
  gjsJs?: string | null
  gjsCss?: string | null
  gjsStyles?: unknown
  gjsComponents?: unknown
}

type GrapesComponentInput = Parameters<Editor['setComponents']>[0]
type GrapesStyleInput = Parameters<Editor['setStyle']>[0]

type CanvasEventHandlers = {
  preventDrag: (e: Event) => boolean
  preventContextMenu: (e: Event) => boolean
  preventSelectStart: (e: Event) => void
  preventCopy: (e: Event) => boolean | void
  preventPaste: (e: Event) => boolean | void
  handleAnchorClick: (e: Event) => void
}

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
    pageBg: dark
      ? 'radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%), linear-gradient(180deg, #020617 0%, #080b13 42%, #020617 100%)'
      : 'radial-gradient(circle at top left, rgba(239,159,39,.10), transparent 30%), linear-gradient(180deg, #fffaf3 0%, #ffffff 44%, #f8fafc 100%)',
    appBg: dark ? '#020617' : '#f8fafc',
    cardBg: dark ? 'rgba(15,23,42,.94)' : 'rgba(255,255,255,.96)',
    cardBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    buttonBg: dark ? 'rgba(15,23,42,.82)' : 'rgba(255,255,255,.92)',
    buttonBgHover: dark ? 'rgba(15,23,42,.96)' : 'rgba(255,255,255,1)',
    buttonBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    buttonText: dark ? '#f8fafc' : '#18181b',
    buttonShadow: dark
      ? '0 14px 34px rgba(0,0,0,.38)'
      : '0 14px 34px rgba(15,23,42,.14)',
    text: dark ? '#f8fafc' : '#18181b',
    textSoft: dark ? 'rgba(248,250,252,.72)' : 'rgba(24,24,27,.72)',
    textMuted: dark ? 'rgba(248,250,252,.46)' : 'rgba(24,24,27,.46)',
    mutedText: dark ? '#94a3b8' : '#6b7280',
    line: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    accent1: '#ef9f27',
    accent2: '#f7c060',
  }
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return locale === 'en' ? 'Not specified' : 'Non renseigne'

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

function safeImage(src?: string | null) {
  return src?.trim() || '/placeholder-reference.svg'
}

function stripHtml(value?: string | null) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
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

export default function PostDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { dark } = useTheme()
  const { t, i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage || i18n.language)
  const articleId = params?.articleId as string

  const mountRef = useRef<HTMLDivElement>(null)
  const gjsRef = useRef<Editor | null>(null)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(900)

  const ui = useMemo(() => getUiColors(dark), [dark])
  const hasGjsContent = Boolean(post?.gjsComponents || post?.gjsHtml)
  const heroImage = safeImage(post?.coverImage)

  useEffect(() => {
    if (!articleId) return

    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await api.get<Post>(
          `/api/articles/${encodeURIComponent(articleId)}`,
        )

        const [translatedPost] = await translateDynamicItems<Post>(
          [res.data],
          locale,
          ['title', 'excerpt'],
        )

        const nextPost = translatedPost ?? res.data

        const [translatedComponents, translatedHtml] = await Promise.all([
          nextPost.gjsComponents
            ? translateGrapesComponents(nextPost.gjsComponents, locale)
            : Promise.resolve(nextPost.gjsComponents),
          !nextPost.gjsComponents && nextPost.gjsHtml
            ? translateHtmlContent(nextPost.gjsHtml, locale)
            : Promise.resolve(nextPost.gjsHtml),
        ])

        if (!cancelled) {
          setPost({
            ...nextPost,
            gjsComponents: translatedComponents,
            gjsHtml: translatedHtml,
          })
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(t('articlesPage.errors.load'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [articleId, locale, t])

  useEffect(() => {
    if (!mountRef.current || !post || !hasGjsContent) return

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
      showToolbar: false,
      multipleSelection: false,
      domComponents: {
        draggableComponents: false,
      },
      commands: {
        defaults: {
          'core:component:delete': { run: () => {} },
          'core:component:copy': { run: () => {} },
          'core:component:paste': { run: () => {} },
          'core:component:duplicate': { run: () => {} },
          'core:component:move': { run: () => {} },
          'core:component:select': { run: () => {} },
          'core:component:style': { run: () => {} },
          'core:component:enter': { run: () => {} },
          'core:component:exit': { run: () => {} },
          'core:component:remove': { run: () => {} },
          'core:component:create': { run: () => {} },
          'core:component:add': { run: () => {} },
          'core:component:clone': { run: () => {} },
        },
      },
      selectorManager: { appendTo: '' },
      traitManager: { appendTo: '', custom: true },
      styleManager: { appendTo: '', sectors: [] },
      layerManager: { appendTo: '', sortable: false, hidable: false },
      blockManager: { appendTo: '', blocks: [] },
      deviceManager: { devices: [] },
      parser: {
        optionsHtml: {
          allowScripts: true,
        },
      },
    })

    gjsRef.current = editor

    editor.on('component:selected', () => {
      editor.select()
    })

    editor.on('component:mouseover', () => {
      editor.Canvas.getHighlighter()?.remove()
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
        editor.setComponents(post.gjsComponents as GrapesComponentInput)
      } else if (post.gjsHtml) {
        editor.setComponents(post.gjsHtml)
      }

      if (post.gjsStyles) {
        editor.setStyle(post.gjsStyles as GrapesStyleInput)
      } else if (post.gjsCss) {
        editor.setStyle(post.gjsCss)
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
            component.components().forEach((child) => disableComponent(child))
          }
        }
      }

      allComponents.forEach((component: unknown) =>
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
          const handlers = (currentEditor as EditorWithEventHandlers)
            .__eventHandlers

          if (canvasDoc && handlers) {
            canvasDoc.body.removeEventListener('dragstart', handlers.preventDrag)
            canvasDoc.body.removeEventListener('drop', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragenter', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragover', handlers.preventDrag)
            canvasDoc.body.removeEventListener('dragend', handlers.preventDrag)
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
  }, [post, dark, hasGjsContent])

  useEffect(() => {
    const editor = gjsRef.current

    if (!editor || !hasGjsContent) return

    syncEmbeddedTheme(editor, dark)

    setTimeout(() => {
      measureCanvasHeight(editor, setCanvasHeight)
    }, 120)
  }, [dark, hasGjsContent])

  if (loading) {
    return (
      <div
        className="post-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="post-state-card">{t('postDetail.loading')}</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div
        className="post-state-page"
        style={{
          background: ui.pageBg,
          color: ui.text,
        }}
      >
        <div className="post-state-card">
          <p>{error || t('postDetail.notFound')}</p>

          <button onClick={() => router.back()}>{t('postDetail.back')}</button>
        </div>
      </div>
    )
  }

  const description =
    stripHtml(post.excerpt) || t('articlesPage.card.noDescription')

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

        .post-detail-page {
          min-height: 100vh;
          background: ${ui.pageBg};
          color: ${ui.text};
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .post-hero {
          position: relative;
          min-height: 640px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          isolation: isolate;
        }

        .post-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background: #020617;
        }

        .post-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.04) contrast(1.04);
        }

        .post-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(2,6,23,.86), rgba(2,6,23,.54), rgba(2,6,23,.20)),
            linear-gradient(180deg, rgba(2,6,23,.10), rgba(2,6,23,.88));
        }

        .post-hero-inner {
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
          max-width: 620px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,.94);
          font-weight: 800;
        }

        .post-kicker-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .post-kicker,
        .post-chip {
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

        .post-kicker {
          background: rgba(239,159,39,.24);
          border: 1px solid rgba(239,159,39,.42);
          color: #fff;
          text-transform: uppercase;
        }

        .post-chip {
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.18);
          color: rgba(255,255,255,.88);
        }

        .post-hero-copy {
          max-width: 920px;
        }

        .post-hero h1 {
          margin: 0;
          font-size: clamp(38px, 6vw, 78px);
          line-height: .96;
          letter-spacing: -.065em;
          font-weight: 950;
        }

        .post-lead {
          margin: 24px 0 0;
          max-width: 760px;
          color: rgba(255,255,255,.78);
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.75;
          font-weight: 550;
        }

        .post-actions {
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

        .post-body {
          width: 100%;
          margin: 0 auto;
          padding: 72px 0 0;
        }

        .post-content-head {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto 28px;
          padding: clamp(24px, 4vw, 36px);
          border-radius: 26px;
          background: ${ui.cardBg};
          border: 1px solid ${ui.cardBorder};
          box-shadow: ${ui.buttonShadow};
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

        .post-content-head p {
          margin: 0;
          color: ${ui.textSoft};
          font-size: 15px;
          line-height: 1.8;
        }

        .post-builder-shell {
          width: 100%;
          background: ${dark ? '#020617' : '#ffffff'};
          border-top: 1px solid ${ui.line};
          border-bottom: 1px solid ${ui.line};
        }

        .post-builder-canvas {
          width: 100%;
        }

        .post-no-builder {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: clamp(24px, 4vw, 36px);
          border-radius: 26px;
          background: ${ui.cardBg};
          border: 1px solid ${ui.cardBorder};
          box-shadow: ${ui.buttonShadow};
          color: ${ui.textSoft};
          line-height: 1.8;
        }

        .post-bottom-cta {
          width: min(1180px, calc(100% - 40px));
          margin: 54px auto 84px;
          padding: clamp(24px, 4vw, 38px);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(239,159,39,.24), transparent 42%),
            ${dark ? '#0f172a' : '#111827'};
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: ${ui.buttonShadow};
          color: #fff;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 22px;
          align-items: center;
        }

        .post-bottom-cta h2 {
          margin: 0 0 8px;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.05;
          letter-spacing: -.045em;
          font-weight: 950;
        }

        .post-bottom-cta p {
          margin: 0;
          color: rgba(255,255,255,.68);
          line-height: 1.7;
          font-size: 15px;
        }

        .post-bottom-cta a {
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
          font-weight: 850;
          white-space: nowrap;
          box-shadow: 0 14px 30px rgba(239,159,39,.28);
        }

        .post-state-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .post-state-card {
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

        .post-state-card p {
          margin: 0 0 18px;
        }

        .post-state-card button {
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
          .post-hero {
            min-height: auto;
          }

          .post-hero-inner {
            padding: 128px 0 46px;
          }

          .post-bottom-cta {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .post-hero-inner,
          .post-content-head,
          .post-no-builder,
          .post-bottom-cta {
            width: min(100% - 28px, 1180px);
          }

          .post-hero h1 {
            font-size: 40px;
          }

          .post-actions {
            flex-direction: column;
          }

          .primary-action,
          .secondary-action {
            width: 100%;
          }

          .breadcrumb strong {
            max-width: 260px;
          }

          .post-bottom-cta a {
            width: 100%;
          }
        }
      `}</style>

      <main className="post-detail-page">
        <section className="post-hero">
          <div className="post-hero-bg">
            <img src={heroImage} alt="" />
            <div className="post-hero-overlay" />
          </div>

          <div className="post-hero-inner">
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link>
              <span>/</span>
              <Link href="/articles">Articles</Link>
              <span>/</span>
              <strong>{post.title}</strong>
            </nav>

            <div className="post-hero-copy">
              <div className="post-kicker-row">
                <span className="post-kicker">Article MD2I</span>

                <span className="post-chip">
                  {formatDate(post.publishedAt || post.createdAt, locale)}
                </span>
              </div>

              <h1>{post.title}</h1>

              <p className="post-lead">{description}</p>

              <div className="post-actions">
                <Link href="/articles" className="secondary-action">
                  Voir tous les articles
                </Link>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="primary-action"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="post-body">
          {hasGjsContent ? (
            <div className="post-builder-shell">
              <div
                className="post-builder-canvas"
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
            <div className="post-no-builder">{description}</div>
          )}

          <div className="post-bottom-cta">
            <div>
              <h2>
                {t('postDetail.cta.title', {
                  defaultValue: 'Vous souhaitez aller plus loin ?',
                })}
              </h2>
              <p>
                {t('postDetail.cta.text', {
                  defaultValue:
                    "Découvrez nos solutions, nos références et les scénarios d'exploitation adaptés à votre contexte métier.",
                })}
              </p>
            </div>

            <Link href="/contact-commercial">
              {t('postDetail.cta.link', {
                defaultValue: 'Contacter MD2I',
              })}
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
