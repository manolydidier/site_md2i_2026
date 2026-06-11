'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'

type BreadcrumbItem = {
  href: string
  label: string
  current?: boolean
}

const ROUTES_WITH_LOCAL_BREADCRUMBS = [
  /^\/$/,
  /^\/a-propos\/?$/,
  /^\/articles\/[^/]+\/?$/,
  /^\/produits\/[^/]+\/?$/,
  /^\/produits\/[^/]+\/lead\/?$/,
  /^\/reference\/[^/]+\/?$/,
]

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function humanizeSegment(segment: string) {
  const decoded = decodeURIComponent(segment)
  const label = decoded.replace(/-/g, ' ').trim()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function labelForPath(
  href: string,
  segment: string,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const routeLabels: Record<string, string> = {
    '/services': t('navbar.links.services', { defaultValue: 'Services' }),
    '/reference': t('navbar.links.references', {
      defaultValue: 'Références',
    }),
    '/produits': t('navbar.links.products', { defaultValue: 'Produits' }),
    '/articles': t('navbar.search.categories.articles', {
      defaultValue: 'Articles',
    }),
    '/a-propos': t('navbar.links.about', {
      defaultValue: 'À propos',
    }),
    '/contact': t('navbar.links.contact', { defaultValue: 'Contact' }),
    '/contact-commercial': t('navbar.links.contactCommercial', {
      defaultValue: 'Contact commercial',
    }),
    
  }

  return routeLabels[href] ?? humanizeSegment(segment)
}

function buildBreadcrumbs(
  pathname: string,
  t: ReturnType<typeof useTranslation>['t'],
): BreadcrumbItem[] {
  const currentPath = normalizePathname(pathname)

  if (ROUTES_WITH_LOCAL_BREADCRUMBS.some((pattern) => pattern.test(currentPath))) {
    return []
  }

  const segments = currentPath.split('/').filter(Boolean)

  if (segments.length === 0) return []

  const breadcrumbs: BreadcrumbItem[] = [
    {
      href: '/',
      label: t('navbar.links.home', { defaultValue: 'Accueil' }),
    },
  ]

  let href = ''

  segments.forEach((segment, index) => {
    href += `/${segment}`

    breadcrumbs.push({
      href,
      label: labelForPath(href, segment, t),
      current: index === segments.length - 1,
    })
  })

  return breadcrumbs
}

export default function PublicBreadcrumbs() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { dark } = useTheme()

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(pathname, t),
    [pathname, t],
  )

  if (breadcrumbs.length === 0) return null

  return (
    <>
      <nav
        className="public-breadcrumbs"
        aria-label="Fil d'Ariane"
        data-theme={dark ? 'dark' : 'light'}
      >
        <ol className="public-breadcrumbs__list">
          {breadcrumbs.map((item, index) => (
            <li className="public-breadcrumbs__item" key={item.href}>
              {index > 0 && (
                <span className="public-breadcrumbs__separator" aria-hidden="true">
                  /
                </span>
              )}

              {item.current ? (
                <span className="public-breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className="public-breadcrumbs__link" href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <style jsx global>{`
        .public-breadcrumbs {
          position: absolute;
          top: 82px;
          left: 0;
          right: 0;
          z-index: 80;
          pointer-events: none;
          padding: 0 clamp(16px, 3vw, 32px);
        }

        .public-breadcrumbs__list {
          width: min(1180px, 100%);
          min-height: 30px;
          margin: 0 auto;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          pointer-events: auto;
          background: transparent;
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          opacity: 0.78;
          transition: opacity 180ms ease;
        }

        .public-breadcrumbs:hover .public-breadcrumbs__list,
        .public-breadcrumbs:focus-within .public-breadcrumbs__list {
          opacity: 1;
        }

        .public-breadcrumbs__list::-webkit-scrollbar {
          display: none;
        }

        .public-breadcrumbs__item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          color: rgba(100, 116, 139, 0.8);
          font-size: 0.76rem;
          font-weight: 650;
          line-height: 1;
          white-space: nowrap;
        }

        .public-breadcrumbs__link,
        .public-breadcrumbs__current {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          border-radius: 999px;
          text-decoration: none;
          transition:
            color 180ms ease,
            background 180ms ease,
            opacity 180ms ease;
        }

        .public-breadcrumbs__link {
          padding: 0 5px;
          color: rgba(71, 85, 105, 0.78);
        }

        .public-breadcrumbs__link:hover {
          color: #0f172a;
          background: rgba(239, 159, 39, 0.1);
        }

        .public-breadcrumbs__link:focus-visible {
          outline: 2px solid rgba(239, 159, 39, 0.35);
          outline-offset: 2px;
        }

        .public-breadcrumbs__current {
          max-width: 420px;
          padding: 0 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(15, 23, 42, 0.84);
          background: rgba(15, 23, 42, 0.045);
          font-weight: 750;
        }

        .public-breadcrumbs__separator {
          color: rgba(100, 116, 139, 0.42);
          font-weight: 700;
        }

        .public-breadcrumbs[data-theme='dark'] .public-breadcrumbs__item,
        .public-breadcrumbs[data-theme='dark'] .public-breadcrumbs__separator {
          color: rgba(232, 230, 240, 0.48);
        }

        .public-breadcrumbs[data-theme='dark'] .public-breadcrumbs__link {
          color: rgba(232, 230, 240, 0.64);
        }

        .public-breadcrumbs[data-theme='dark'] .public-breadcrumbs__link:hover {
          color: #ffffff;
          background: rgba(239, 159, 39, 0.16);
        }

        .public-breadcrumbs[data-theme='dark'] .public-breadcrumbs__current {
          color: rgba(255, 255, 255, 0.82);
          background: rgba(255, 255, 255, 0.075);
        }

        @media (max-width: 768px) {
          .public-breadcrumbs {
            top: 72px;
            padding-inline: 14px;
          }

          .public-breadcrumbs__list {
            min-height: 28px;
            opacity: 0.72;
          }

          .public-breadcrumbs__item {
            font-size: 0.72rem;
            gap: 5px;
          }

          .public-breadcrumbs__link,
          .public-breadcrumbs__current {
            min-height: 24px;
          }

          .public-breadcrumbs__current {
            max-width: 240px;
          }
        }

        @media (max-width: 480px) {
          .public-breadcrumbs {
            top: 68px;
          }

          .public-breadcrumbs__list {
            opacity: 0.68;
          }

          .public-breadcrumbs__current {
            max-width: 180px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .public-breadcrumbs__list,
          .public-breadcrumbs__link,
          .public-breadcrumbs__current {
            transition: none;
          }
        }
      `}</style>
    </>
  )
}