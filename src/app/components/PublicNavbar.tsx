'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Search,
  X,
  ChevronDown as ChevronDownLucide,
  ArrowRight as ArrowRightLucide,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { LANGUAGE_OPTIONS, normalizeLocale } from '../i18n/settings'
import logo from '../../assets/logo.png'

const ORANGE = '#EF9F27'
const LOGO_SRC = logo

type NavChild = {
  href: string
  label: string
  description?: string
}

type NavItem = {
  href: string
  label: string
  description?: string
  children?: NavChild[]
}

type NavChildDefinition = {
  href: string
  labelKey: string
  descriptionKey?: string
}

type NavItemDefinition = {
  href: string
  labelKey: string
  descriptionKey?: string
  children?: NavChildDefinition[]
}

type SearchCategory = 'products' | 'articles' | 'references' | 'links'

type ApiSearchResult = {
  id: string
  category: SearchCategory
  title: string
  description?: string | null
  href: string
  image?: string | null
  meta?: string | null
}

type ApiSearchResponse = {
  query: string
  scope: 'all' | SearchCategory
  results: Partial<Record<SearchCategory, ApiSearchResult[]>> & {
    news?: ApiSearchResult[]
  }
  suggestions: string[]
  total: number
}

const LINK_DEFS: NavItemDefinition[] = [
  { href: '/', labelKey: 'navbar.links.home' },
  { href: '/services', labelKey: 'navbar.links.services' },
  { href: '/reference', labelKey: 'navbar.links.references' },
  { href: '/produits', labelKey: 'navbar.links.products' },
  { href: '/a-propos', labelKey: 'navbar.links.about' },
  {
    href: '/contact',
    labelKey: 'navbar.links.contact',
    children: [
      {
        href: '/contact',
        labelKey: 'navbar.links.contactGeneral',
        descriptionKey: 'navbar.links.contactGeneralDescription',
      },
      {
        href: '/contact-commercial',
        labelKey: 'navbar.links.contactCommercial',
        descriptionKey: 'navbar.links.contactCommercialDescription',
      },
    ],
  },
]

function AnimatedLucideIcon({
  icon: Icon,
  className = '',
  size = 18,
  strokeWidth = 2.25,
}: {
  icon: LucideIcon
  className?: string
  size?: number
  strokeWidth?: number
}) {
  return (
    <motion.span
      className={`pro-lucide-icon ${className}`}
      whileHover={{ scale: 1.16, rotate: 8 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={strokeWidth} />
    </motion.span>
  )
}

const SearchIcon = () => (
  <AnimatedLucideIcon icon={Search} className="pro-lucide-search" />
)

const CloseIcon = () => (
  <AnimatedLucideIcon icon={X} className="pro-lucide-close" size={20} />
)

const ChevronDown = ({ open }: { open: boolean }) => (
  <ChevronDownLucide
    size={14}
    strokeWidth={2.4}
    aria-hidden="true"
    style={{
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform .22s ease',
    }}
  />
)

const ArrowRight = () => (
  <ArrowRightLucide size={15} strokeWidth={2.4} aria-hidden="true" />
)

function ThemeSwitch({
  dark,
  onToggle,
  ariaLabel,
}: {
  dark: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <>
      <style>{`
        .ts {
          --sz: 12.3px;
          --w: 5.625em;
          --h: 2.5em;
          --r: 6.25em;
          --light-bg: linear-gradient(135deg, #f7b64c 0%, #ef9f27 48%, #d8790b 100%);
          --night-bg: linear-gradient(135deg, #050505 0%, #111111 45%, #1f1f1f 100%);
          --dia: 3.375em;
          --sun-dia: 2.125em;
          --sun-bg: #fff0bf;
          --moon-bg: #f4f4f5;
          --spot: #2a2a2a;
          --offset: calc((var(--dia) - var(--h)) / 2 * -1);
          --stars: #f4f4f5;
          --clouds: #fff2d2;
          --back-clouds: #d87512;
          --tr: .5s cubic-bezier(0, -0.02, 0.4, 1.25);
          --ctr: .3s cubic-bezier(0, -0.02, 0.35, 1.17);
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--sz);
          line-height: 1;
          -webkit-tap-highlight-color: transparent;
        }

        .ts,
        .ts *,
        .ts *::before,
        .ts *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-size: var(--sz);
        }

        .ts__cb {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .ts__container {
          width: var(--w);
          height: var(--h);
          background: var(--light-bg);
          border-radius: var(--r);
          overflow: hidden;
          cursor: pointer;
          box-shadow:
            0 0 0 1px rgba(239, 159, 39, .32),
            0 .45em 1.2em rgba(239, 159, 39, .22),
            0em -0.062em 0.062em rgba(0, 0, 0, 0.20),
            0em 0.062em 0.125em rgba(255, 255, 255, 0.72);
          transition: var(--tr);
          position: relative;
        }

        .ts__container::before {
          content: '';
          position: absolute;
          z-index: 1;
          inset: 0;
          box-shadow:
            0em 0.05em 0.187em rgba(0, 0, 0, 0.22) inset,
            0em 0.05em 0.187em rgba(255, 255, 255, 0.15) inset;
          border-radius: var(--r);
          pointer-events: none;
        }

        .ts:focus-within .ts__container {
          outline: 2px solid rgba(239, 159, 39, .52);
          outline-offset: 3px;
        }

        .ts__circle-container {
          width: var(--dia);
          height: var(--dia);
          background-color: rgba(255, 255, 255, 0.12);
          position: absolute;
          left: var(--offset);
          top: var(--offset);
          border-radius: var(--r);
          box-shadow:
            inset 0 0 0 3.375em rgba(255, 255, 255, 0.10),
            0 0 0 0.625em rgba(255, 226, 178, 0.10),
            0 0 0 1.25em rgba(255, 226, 178, 0.10);
          display: flex;
          transition: var(--ctr);
          pointer-events: none;
        }

        .ts__sun-moon-container {
          pointer-events: auto;
          position: relative;
          z-index: 2;
          width: var(--sun-dia);
          height: var(--sun-dia);
          margin: auto;
          border-radius: var(--r);
          background-color: var(--sun-bg);
          box-shadow:
            0.062em 0.062em 0.062em 0em rgba(255, 255, 255, 0.72) inset,
            0em -0.062em 0.062em 0em rgba(168, 94, 8, .55) inset;
          filter:
            drop-shadow(0.062em 0.125em 0.125em rgba(0, 0, 0, 0.25))
            drop-shadow(0em 0.062em 0.125em rgba(239, 159, 39, 0.30));
          overflow: hidden;
          transition: var(--tr);
        }

        .ts__moon {
          transform: translateX(100%);
          width: 100%;
          height: 100%;
          background-color: var(--moon-bg);
          border-radius: inherit;
          box-shadow:
            0.062em 0.062em 0.062em 0em rgba(255, 255, 255, 0.50) inset,
            0em -0.062em 0.062em 0em rgba(0, 0, 0, .45) inset;
          transition: var(--tr);
          position: relative;
        }

        .ts__spot {
          position: absolute;
          top: 0.75em;
          left: 0.312em;
          width: 0.75em;
          height: 0.75em;
          border-radius: var(--r);
          background-color: var(--spot);
          box-shadow: 0em 0.0312em 0.062em rgba(0, 0, 0, 0.22) inset;
        }

        .ts__spot:nth-of-type(2) {
          width: 0.375em;
          height: 0.375em;
          top: 0.937em;
          left: 1.375em;
        }

        .ts__spot:nth-last-of-type(3) {
          width: 0.25em;
          height: 0.25em;
          top: 0.312em;
          left: 0.812em;
        }

        .ts__clouds {
          width: 1.25em;
          height: 1.25em;
          background-color: var(--clouds);
          border-radius: var(--r);
          position: absolute;
          bottom: -0.625em;
          left: 0.312em;
          box-shadow:
            0.937em 0.312em var(--clouds),
            -0.312em -0.312em var(--back-clouds),
            1.437em 0.375em var(--clouds),
            0.5em -0.125em var(--back-clouds),
            2.187em 0 var(--clouds),
            1.25em -0.062em var(--back-clouds),
            2.937em 0.312em var(--clouds),
            2em -0.312em var(--back-clouds),
            3.625em -0.062em var(--clouds),
            2.625em 0em var(--back-clouds),
            4.5em -0.312em var(--clouds),
            3.375em -0.437em var(--back-clouds),
            4.625em -1.75em 0 0.437em var(--clouds),
            4em -0.625em var(--back-clouds),
            4.125em -2.125em 0 0.437em var(--back-clouds);
          transition: 0.5s cubic-bezier(0, -0.02, 0.4, 1.25);
        }

        .ts__stars-container {
          position: absolute;
          color: var(--stars);
          top: -100%;
          left: 0.312em;
          width: 2.75em;
          height: auto;
          transition: var(--tr);
        }

        .ts__cb:checked + .ts__container {
          background: var(--night-bg);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, .16),
            0 .45em 1.35em rgba(0, 0, 0, .34),
            0em -0.062em 0.062em rgba(0, 0, 0, 0.55),
            0em 0.062em 0.125em rgba(255, 255, 255, 0.10);
        }

        .ts__cb:checked + .ts__container .ts__circle-container {
          left: calc(100% - var(--offset) - var(--dia));
        }

        .ts__cb:checked + .ts__container .ts__circle-container:hover {
          left: calc(100% - var(--offset) - var(--dia) - 0.187em);
        }

        .ts__circle-container:hover {
          left: calc(var(--offset) + 0.187em);
        }

        .ts__cb:checked + .ts__container .ts__moon {
          transform: translate(0);
        }

        .ts__cb:checked + .ts__container .ts__clouds {
          bottom: -4.062em;
        }

        .ts__cb:checked + .ts__container .ts__stars-container {
          top: 50%;
          transform: translateY(-50%);
        }
      `}</style>

      <label className="ts" aria-label={ariaLabel}>
        <input
          type="checkbox"
          className="ts__cb"
          checked={dark}
          onChange={onToggle}
          aria-label={ariaLabel}
        />
        <div className="ts__container">
          <div className="ts__clouds" />
          <div className="ts__stars-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 144 55"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="ts__circle-container">
            <div className="ts__sun-moon-container">
              <div className="ts__moon">
                <div className="ts__spot" />
                <div className="ts__spot" />
                <div className="ts__spot" />
              </div>
            </div>
          </div>
        </div>
      </label>
    </>
  )
}

function tokens(dark: boolean, scrolled: boolean) {
  return {
    shellBg: dark
      ? scrolled
        ? 'rgba(10,10,14,.90)'
        : 'rgba(10,10,14,.82)'
      : scrolled
        ? 'rgba(255,255,255,.94)'
        : 'rgba(255,255,255,.88)',
    shellBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
    shellShadow: dark
      ? '0 14px 40px rgba(0,0,0,.22)'
      : '0 14px 40px rgba(0,0,0,.08)',
    text: dark ? '#F4F1EC' : '#0D0E10',
    softText: dark ? 'rgba(255,255,255,.58)' : 'rgba(0,0,0,.56)',
    subtleText: dark ? 'rgba(255,255,255,.38)' : 'rgba(0,0,0,.38)',
    line: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)',
    itemHover: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
    iconBg: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)',
    iconBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
    dropdownBg: dark ? 'rgba(16,16,22,.97)' : 'rgba(255,255,255,.98)',
    mobileBg: dark ? 'rgba(16,16,22,.98)' : 'rgba(255,255,255,.98)',
    orangeSoft: dark ? 'rgba(239,159,39,.12)' : 'rgba(239,159,39,.08)',
    orangeBorder: 'rgba(239,159,39,.28)',
  }
}

function EmptySearchMessage({
  message,
  color,
}: {
  message: string
  color: string
}) {
  return (
    <div
      style={{
        padding: '28px 14px',
        color,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}

function getResultsForCategory(
  data: ApiSearchResponse | null,
  category: SearchCategory
) {
  if (!data?.results) return []

  if (category === 'articles') {
    return data.results.articles ?? data.results.news ?? []
  }

  return data.results[category] ?? []
}

function SearchModal({
  open,
  onClose,
  dark,
  links,
}: {
  open: boolean
  onClose: () => void
  dark: boolean
  links: NavItem[]
}) {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | SearchCategory>('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApiSearchResponse | null>(null)
  const [error, setError] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const t = tokens(dark, true)

  const categories: Array<{
    value: 'all' | SearchCategory
    label: string
  }> = [
    { value: 'all', label: 'Tout' },
    { value: 'products', label: 'Produits' },
    { value: 'articles', label: 'Articles' },
    { value: 'references', label: 'Références' },
    { value: 'links', label: 'Liens' },
  ]

  const resultGroups: Array<{
    value: SearchCategory
    label: string
  }> = [
    { value: 'products', label: 'Produits' },
    { value: 'articles', label: 'Articles' },
    { value: 'references', label: 'Références' },
    { value: 'links', label: 'Liens' },
  ]

  const flatResults = useMemo(() => {
    return [
      ...getResultsForCategory(data, 'products'),
      ...getResultsForCategory(data, 'articles'),
      ...getResultsForCategory(data, 'references'),
      ...getResultsForCategory(data, 'links'),
    ]
  }, [data])

  useEffect(() => {
    if (!open) return

    const id = window.setTimeout(() => {
      setQuery('')
      setScope('all')
      setData(null)
      setError(false)
      setSelectedIndex(-1)
      inputRef.current?.focus()
    }, 120)

    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    const q = query.trim()

    if (q.length < 2) {
      setData(null)
      setLoading(false)
      setError(false)
      setSelectedIndex(-1)
      return
    }

    const controller = new AbortController()

    const id = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError(false)

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&scope=${scope}&limit=6`,
          {
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const json = (await response.json()) as ApiSearchResponse
        setData(json)
      } catch (error) {
        if (!controller.signal.aborted) {
          setData(null)
          setError(true)
          setSelectedIndex(-1)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 260)

    return () => {
      window.clearTimeout(id)
      controller.abort()
    }
  }, [query, scope, open])

  useEffect(() => {
    if (flatResults.length > 0) {
      setSelectedIndex(0)
    } else {
      setSelectedIndex(-1)
    }
  }, [flatResults.length])

  useEffect(() => {
    if (selectedIndex < 0) return

    const element = document.getElementById(`search-result-${selectedIndex}`)
    element?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [selectedIndex])

  if (!open || typeof document === 'undefined') return null

  const quickLinks = links.slice(0, 6)

  const handleOpenResult = (result: ApiSearchResult) => {
    onClose()
    router.push(result.href)
  }

  const handleInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>
  ) => {
    if (!flatResults.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()

      setSelectedIndex((value) => {
        if (value < 0) return 0
        return (value + 1) % flatResults.length
      })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      setSelectedIndex((value) => {
        if (value <= 0) return flatResults.length - 1
        return value - 1
      })
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const result = flatResults[selectedIndex >= 0 ? selectedIndex : 0]

      if (result) {
        handleOpenResult(result)
      }
    }
  }

  let globalIndex = -1

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="search-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose()
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: dark
            ? 'radial-gradient(circle at top, rgba(239,159,39,.10), transparent 34%), rgba(0,0,0,.72)'
            : 'radial-gradient(circle at top, rgba(239,159,39,.16), transparent 34%), rgba(15,23,42,.44)',
          backdropFilter: 'blur(26px) saturate(1.12)',
          WebkitBackdropFilter: 'blur(26px) saturate(1.12)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 'clamp(72px, 12vh, 118px) 12px 24px',
          fontFamily: "'Inter', 'DM Sans', sans-serif",
        }}
      >
        <motion.div
          key="search-panel"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          onMouseDown={(event) => event.stopPropagation()}
          style={{
            width: 'min(820px, calc(100vw - 24px))',
            borderRadius: 30,
            overflow: 'hidden',
            background: dark
              ? 'linear-gradient(180deg, rgba(22,22,32,.98), rgba(9,9,14,.99))'
              : 'linear-gradient(180deg, rgba(255,255,255,.99), rgba(248,250,252,.99))',
            border: `1px solid ${
              dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.78)'
            }`,
            boxShadow: dark
              ? '0 38px 120px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.05)'
              : '0 38px 120px rgba(15,23,42,.30), inset 0 1px 0 rgba(255,255,255,.82)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '18px 20px',
              borderBottom: `1px solid ${t.line}`,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ORANGE,
                background: t.orangeSoft,
                border: `1px solid ${t.orangeBorder}`,
                flexShrink: 0,
                boxShadow: '0 10px 24px rgba(239,159,39,.16)',
              }}
            >
              <SearchIcon />
            </span>

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Rechercher un produit, article, référence ou lien..."
              autoComplete="off"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 17,
                color: t.text,
                fontFamily: 'inherit',
                fontWeight: 650,
              }}
            />

            <button
              onClick={onClose}
              aria-label="Fermer la recherche"
              style={{
                border: `1px solid ${t.iconBorder}`,
                background: t.iconBg,
                color: t.softText,
                borderRadius: 14,
                width: 38,
                height: 38,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 14px',
              borderBottom: `1px solid ${t.line}`,
              overflowX: 'auto',
            }}
          >
            {categories.map((category) => {
              const active = scope === category.value

              return (
                <button
                  key={category.value}
                  onClick={() => {
                    setScope(category.value)
                    setSelectedIndex(-1)
                  }}
                  style={{
                    border: `1px solid ${
                      active ? t.orangeBorder : t.iconBorder
                    }`,
                    background: active ? t.orangeSoft : t.iconBg,
                    color: active ? ORANGE : t.softText,
                    borderRadius: 999,
                    padding: '8px 13px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: active ? 800 : 650,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {category.label}
                </button>
              )
            })}
          </div>

          <div
            style={{
              padding: 10,
              maxHeight: 'min(530px, calc(100vh - 252px))',
              overflowY: 'auto',
            }}
          >
            {query.trim().length === 0 ? (
              <>
                <div
                  style={{
                    padding: '16px 12px 12px',
                    color: t.subtleText,
                    fontSize: 14,
                  }}
                >
                  Commence à taper pour rechercher dans le site.
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="pro-search-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '13px 14px',
                        borderRadius: 17,
                        textDecoration: 'none',
                        color: t.text,
                        fontSize: 15,
                        background: dark
                          ? 'rgba(255,255,255,.025)'
                          : 'rgba(15,23,42,.025)',
                        border: `1px solid ${
                          dark
                            ? 'rgba(255,255,255,.035)'
                            : 'rgba(15,23,42,.035)'
                        }`,
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ color: t.subtleText }}>
                        <ArrowRight />
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : query.trim().length < 2 ? (
              <EmptySearchMessage
                color={t.subtleText}
                message="Tape au moins 2 caractères pour lancer la recherche."
              />
            ) : loading ? (
              <div style={{ padding: '22px 14px' }}>
                {[0, 1, 2].map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0.34 }}
                    animate={{ opacity: [0.34, 0.86, 0.34] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: item * 0.12,
                    }}
                    style={{
                      height: 60,
                      borderRadius: 19,
                      marginBottom: 9,
                      background: dark
                        ? 'rgba(255,255,255,.065)'
                        : 'rgba(15,23,42,.06)',
                    }}
                  />
                ))}
              </div>
            ) : error ? (
              <EmptySearchMessage
                color={t.subtleText}
                message="Une erreur est survenue pendant la recherche."
              />
            ) : data && flatResults.length > 0 ? (
              <>
                {(data.suggestions ?? []).length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      padding: '6px 6px 12px',
                    }}
                  >
                    {data.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        style={{
                          border: `1px solid ${t.iconBorder}`,
                          background: t.iconBg,
                          color: t.softText,
                          borderRadius: 999,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 650,
                          fontFamily: 'inherit',
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {resultGroups.map((group) => {
                  const items = getResultsForCategory(data, group.value)

                  if (!items.length) return null

                  return (
                    <div key={group.value} style={{ marginBottom: 13 }}>
                      <div
                        style={{
                          padding: '8px 8px 7px',
                          color: ORANGE,
                          fontSize: 12,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                        }}
                      >
                        {group.label}
                      </div>

                      <div style={{ display: 'grid', gap: 7 }}>
                        {items.map((item) => {
                          globalIndex += 1
                          const selected = globalIndex === selectedIndex

                          return (
                            <Link
                              id={`search-result-${globalIndex}`}
                              key={`${item.category}-${item.id}`}
                              href={item.href}
                              onClick={onClose}
                              onMouseEnter={() =>
                                setSelectedIndex(globalIndex)
                              }
                              style={{
                                display: 'grid',
                                gridTemplateColumns: item.image
                                  ? '52px 1fr auto'
                                  : '1fr auto',
                                alignItems: 'center',
                                gap: 13,
                                padding: '12px 14px',
                                borderRadius: 20,
                                textDecoration: 'none',
                                color: t.text,
                                background: selected
                                  ? t.orangeSoft
                                  : dark
                                    ? 'rgba(255,255,255,.038)'
                                    : 'rgba(15,23,42,.026)',
                                border: `1px solid ${
                                  selected
                                    ? t.orangeBorder
                                    : dark
                                      ? 'rgba(255,255,255,.055)'
                                      : 'rgba(15,23,42,.05)'
                                }`,
                                boxShadow: selected
                                  ? dark
                                    ? '0 12px 32px rgba(0,0,0,.26)'
                                    : '0 12px 32px rgba(15,23,42,.10)'
                                  : 'none',
                                transition:
                                  'background .16s ease, border-color .16s ease, box-shadow .16s ease, transform .16s ease',
                              }}
                            >
                              {item.image && (
                                <span
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    background: t.iconBg,
                                    border: `1px solid ${t.iconBorder}`,
                                  }}
                                >
                                  <img
                                    src={item.image}
                                    alt=""
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                </span>
                              )}

                              <span
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 5,
                                  minWidth: 0,
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 850,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.title}
                                </strong>

                                {(item.description || item.meta) && (
                                  <span
                                    style={{
                                      color: t.subtleText,
                                      fontSize: 12,
                                      lineHeight: 1.42,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {item.description || item.meta}
                                  </span>
                                )}
                              </span>

                              <span
                                style={{
                                  color: selected ? ORANGE : t.subtleText,
                                  flexShrink: 0,
                                  display: 'flex',
                                }}
                              >
                                <ArrowRight />
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <EmptySearchMessage
                color={t.subtleText}
                message={`Aucun résultat pour “${query}”.`}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              borderTop: `1px solid ${t.line}`,
              color: t.subtleText,
              fontSize: 12,
            }}
          >
            <span>↑ ↓ pour naviguer · Entrée pour ouvrir</span>
            <span>Échap pour fermer</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default function PublicNavbar() {
  const pathname = usePathname()
  const { dark, toggleTheme } = useTheme()
  const { t: translate, i18n } = useTranslation()

  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [logoError, setLogoError] = useState(false)
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null)

  const langRef = useRef<HTMLDivElement>(null)
  const navMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScroll = useRef(0)

  const t = useMemo(() => tokens(dark, scrolled), [dark, scrolled])
  const currentLocale = normalizeLocale(i18n.resolvedLanguage || i18n.language)
  const currentLang =
    LANGUAGE_OPTIONS.find((language) => language.code === currentLocale) ??
    LANGUAGE_OPTIONS[0]

  const links = useMemo<NavItem[]>(
    () =>
      LINK_DEFS.map((item) => ({
        href: item.href,
        label: translate(item.labelKey),
        description: item.descriptionKey
          ? translate(item.descriptionKey)
          : undefined,
        children: item.children?.map((child) => ({
          href: child.href,
          label: translate(child.labelKey),
          description: child.descriptionKey
            ? translate(child.descriptionKey)
            : undefined,
        })),
      })),
    [translate]
  )

  const searchLinks = useMemo(
    () =>
      links.flatMap((item) => {
        if (!item.children?.length) return [item]

        return [
          {
            href: item.href,
            label: item.label,
            description: item.description,
          },
          ...item.children,
        ]
      }),
    [links]
  )

  const navbarShown = visible

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0)

    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    let ticking = false

    const handler = () => {
      if (ticking) return

      ticking = true

      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastScroll.current

        setScrolled((prev) => {
          if (prev) return y > 12
          return y > 28
        })

        if (y <= 24) {
          setVisible(true)
        } else if (delta > 10) {
          setVisible(false)
          setMobileOpen(false)
          setOpenDesktopMenu(null)
        } else if (delta < -10) {
          setVisible(true)
        }

        lastScroll.current = y
        ticking = false
      })
    }

    handler()

    window.addEventListener('scroll', handler, { passive: true })

    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const fn = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
      }
    }

    window.addEventListener('keydown', fn)

    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    const fn = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }

    document.addEventListener('mousedown', fn)

    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMobileOpen(false)
      setLangOpen(false)
      setOpenDesktopMenu(null)
    }, 0)

    return () => window.clearTimeout(id)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) return

    document.body.style.overflow = mobileOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, searchOpen])

  const handleLangSelect = useCallback(
    (lang: (typeof LANGUAGE_OPTIONS)[number]) => {
      i18n.changeLanguage(lang.code)
      setLangOpen(false)
    },
    [i18n]
  )

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isItemActive = (item: NavItem) => {
    if (isActive(item.href)) return true

    return item.children?.some((child) => isActive(child.href)) || false
  }

  const openMenu = (href: string) => {
    if (navMenuTimer.current) clearTimeout(navMenuTimer.current)
    setOpenDesktopMenu(href)
  }

  const closeMenuSoon = () => {
    if (navMenuTimer.current) clearTimeout(navMenuTimer.current)

    navMenuTimer.current = setTimeout(() => {
      setOpenDesktopMenu(null)
    }, 120)
  }

  const navHeight = 68
  const navTop = 12
  const headerOffset = navHeight + navTop + 8

  const iconBtn = useMemo(
    () => ({
      width: 42,
      height: 42,
      borderRadius: 15,
      border: `1px solid ${t.iconBorder}`,
      background: t.iconBg,
      color: t.softText,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition:
        'transform .18s ease, color .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    [t]
  )

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes mobilePanelIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes submenuIn {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes searchPulse {
          0%, 100% { transform: scale(1); opacity: .88; }
          50%      { transform: scale(1.12); opacity: 1; }
        }

        .pro-lucide-icon {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: currentColor;
          line-height: 1;
        }

        .pro-lucide-icon svg {
          width: 20px;
          height: 20px;
          display: block;
          stroke: currentColor;
        }

        .pro-lucide-search {
          animation: searchPulse 1.8s ease-in-out infinite;
        }

        .pro-lucide-close {
          opacity: .92;
        }

        .pro-nav-link {
          position: relative;
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          transition: all .18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .pro-nav-link::after {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 6px;
          height: 2px;
          border-radius: 999px;
          background: ${ORANGE};
          transform: scaleX(0);
          transform-origin: center;
          transition: transform .22s ease;
        }

        .pro-nav-link:hover::after,
        .pro-nav-link.active::after {
          transform: scaleX(1);
        }

        .pro-submenu-link:hover {
          background: ${t.itemHover} !important;
        }

        .pro-submenu-link:hover .pro-submenu-arrow {
          transform: translateX(3px);
          color: ${ORANGE} !important;
        }

        .pro-search-link:hover {
          background: ${t.itemHover} !important;
        }

        .pro-icon:hover {
          transform: translateY(-1px);
          color: ${ORANGE} !important;
          background: ${
            dark ? 'rgba(239,159,39,.11)' : 'rgba(239,159,39,.09)'
          } !important;
          border-color: rgba(239,159,39,.40) !important;
          box-shadow: 0 10px 26px rgba(239,159,39,.18);
        }

        .pro-lang-item:hover   { background: ${t.itemHover} !important; }
        .pro-mobile-link:hover { background: ${t.itemHover} !important; }

        @media (max-width: 980px) {
          .pro-desktop-nav   { display: none !important; }
          .pro-mobile-toggle { display: flex !important; }
        }

        @media (min-width: 981px) {
          .pro-mobile-toggle { display: none !important; }
        }
      `}</style>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        dark={dark}
        links={searchLinks}
      />

      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          paddingTop: navTop,
          paddingLeft: 'clamp(12px, 2vw, 24px)',
          paddingRight: 'clamp(12px, 2vw, 24px)',
          transform: navbarShown
            ? 'translate3d(0,0,0)'
            : 'translate3d(0,-120%,0)',
          transition: 'transform .32s cubic-bezier(0.22,1,0.36,1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: navbarShown ? 'auto' : 'none',
        }}
      >
        <nav
          style={{
            height: navHeight,
            borderRadius: 24,
            border: `1px solid ${t.shellBorder}`,
            background: t.shellBg,
            boxShadow: t.shellShadow,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px 0 18px',
            animation: 'navFadeIn .22s ease',
            transform: 'translateZ(0)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              minWidth: 0,
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: t.text,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: dark
                    ? 'rgba(255,255,255,.04)'
                    : 'rgba(0,0,0,.02)',
                  border: `1px solid ${t.iconBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {!logoError ? (
                  <Image
                    src={LOGO_SRC}
                    alt="Logo MD2I"
                    width={40}
                    height={40}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: 'contain',
                    }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span
                    style={{
                      color: ORANGE,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    MD
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    color: t.text,
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  MD2I
                </span>

                <span
                  style={{
                    color: t.subtleText,
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {translate('navbar.brand.tagline')}
                </span>
              </div>
            </Link>

            <div
              className="pro-desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {links.map((link) => {
                const active = isItemActive(link)
                const hasChildren = Boolean(link.children?.length)
                const menuOpen = openDesktopMenu === link.href

                if (hasChildren) {
                  return (
                    <div
                      key={link.href}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => openMenu(link.href)}
                      onMouseLeave={closeMenuSoon}
                      onFocus={() => openMenu(link.href)}
                    >
                      <Link
                        href={link.href}
                        className={`pro-nav-link${active ? ' active' : ''}`}
                        style={{
                          color: active ? t.text : t.softText,
                          background: active ? t.itemHover : 'transparent',
                        }}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                      >
                        {link.label}
                        <ChevronDown open={menuOpen} />
                      </Link>

                      {menuOpen && (
                        <div
                          role="menu"
                          onMouseEnter={() => openMenu(link.href)}
                          onMouseLeave={closeMenuSoon}
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            right: 0,
                            width: 270,
                            padding: 8,
                            borderRadius: 20,
                            border: `1px solid ${t.shellBorder}`,
                            background: t.dropdownBg,
                            boxShadow: dark
                              ? '0 20px 46px rgba(0,0,0,.32)'
                              : '0 20px 46px rgba(0,0,0,.12)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            animation: 'submenuIn .18s ease',
                          }}
                        >
                          {link.children?.map((child) => {
                            const childActive = isActive(child.href)

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                role="menuitem"
                                className="pro-submenu-link"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                  padding: '12px 13px',
                                  borderRadius: 15,
                                  color: childActive ? ORANGE : t.text,
                                  background: childActive
                                    ? t.orangeSoft
                                    : 'transparent',
                                  textDecoration: 'none',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 750,
                                    }}
                                  >
                                    {child.label}
                                  </strong>

                                  {child.description && (
                                    <span
                                      style={{
                                        color: t.subtleText,
                                        fontSize: 12,
                                        lineHeight: 1.35,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {child.description}
                                    </span>
                                  )}
                                </span>

                                <span
                                  className="pro-submenu-arrow"
                                  style={{
                                    color: childActive ? ORANGE : t.subtleText,
                                    transition: 'all .18s ease',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ArrowRight />
                                </span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`pro-nav-link${active ? ' active' : ''}`}
                    style={{
                      color: active ? t.text : t.softText,
                      background: active ? t.itemHover : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button
              className="pro-icon"
              onClick={() => setSearchOpen(true)}
              aria-label={translate('navbar.search.aria')}
              style={{
                ...iconBtn,
                color: ORANGE,
                background: dark
                  ? 'rgba(239,159,39,.10)'
                  : 'rgba(239,159,39,.08)',
                border: '1px solid rgba(239,159,39,.30)',
              }}
            >
              <SearchIcon />
            </button>

            <ThemeSwitch
              dark={dark}
              onToggle={toggleTheme}
              ariaLabel={
                dark
                  ? translate('navbar.theme.light')
                  : translate('navbar.theme.dark')
              }
            />

            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                className="pro-icon"
                onClick={() => setLangOpen((value) => !value)}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label={translate('navbar.language.menu')}
                style={{
                  ...iconBtn,
                  width: 'auto',
                  padding: '0 12px',
                  gap: 8,
                  color: t.text,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span>{currentLang.shortLabel}</span>
                <ChevronDown open={langOpen} />
              </button>

              {langOpen && (
                <ul
                  role="listbox"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    minWidth: 170,
                    margin: 0,
                    padding: 8,
                    listStyle: 'none',
                    borderRadius: 18,
                    border: `1px solid ${t.shellBorder}`,
                    background: t.dropdownBg,
                    boxShadow: dark
                      ? '0 18px 40px rgba(0,0,0,.26)'
                      : '0 18px 40px rgba(0,0,0,.10)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const selected = currentLang.code === lang.code

                    return (
                      <li
                        key={lang.code}
                        role="option"
                        aria-selected={selected}
                        className="pro-lang-item"
                        onClick={() => handleLangSelect(lang)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 12,
                          cursor: 'pointer',
                          color: selected ? ORANGE : t.text,
                          background: selected ? t.orangeSoft : 'transparent',
                          fontSize: 14,
                          fontWeight: selected ? 700 : 500,
                        }}
                      >
                        <span>{lang.shortLabel}</span>
                        <span>{lang.label}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <button
              className="pro-mobile-toggle pro-icon"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-label={translate('navbar.mobileMenu')}
              style={{
                ...iconBtn,
                display: 'none',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  style={{
                    width: 16,
                    height: 1.8,
                    borderRadius: 999,
                    background: mobileOpen ? ORANGE : t.text,
                    transition: 'all .2s ease',
                    transform:
                      mobileOpen && index === 0
                        ? 'translateY(5.8px) rotate(45deg)'
                        : mobileOpen && index === 2
                          ? 'translateY(-5.8px) rotate(-45deg)'
                          : mobileOpen && index === 1
                            ? 'scaleX(0)'
                            : 'none',
                    opacity: mobileOpen && index === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 24,
              border: `1px solid ${t.shellBorder}`,
              background: t.mobileBg,
              boxShadow: dark
                ? '0 18px 42px rgba(0,0,0,.24)'
                : '0 18px 42px rgba(0,0,0,.10)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: 14,
              animation: 'mobilePanelIn .22s ease',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              {links.map((link) => {
                const active = isItemActive(link)

                if (link.children?.length) {
                  return (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        className="pro-mobile-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textDecoration: 'none',
                          padding: '13px 14px',
                          borderRadius: 14,
                          color: active ? t.text : t.softText,
                          background: active ? t.itemHover : 'transparent',
                          fontSize: 15,
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        <span>{link.label}</span>
                        <span style={{ color: active ? ORANGE : t.subtleText }}>
                          <ArrowRight />
                        </span>
                      </Link>

                      <div
                        style={{
                          display: 'grid',
                          gap: 4,
                          margin: '4px 0 8px 14px',
                          paddingLeft: 10,
                          borderLeft: `1px solid ${t.line}`,
                        }}
                      >
                        {link.children.map((child) => {
                          const childActive = isActive(child.href)

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="pro-mobile-link"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                textDecoration: 'none',
                                padding: '11px 12px',
                                borderRadius: 13,
                                color: childActive ? ORANGE : t.softText,
                                background: childActive
                                  ? t.orangeSoft
                                  : 'transparent',
                                fontSize: 14,
                                fontWeight: childActive ? 700 : 500,
                              }}
                            >
                              <span>{child.label}</span>
                              <span
                                style={{
                                  color: childActive ? ORANGE : t.subtleText,
                                }}
                              >
                                <ArrowRight />
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="pro-mobile-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      padding: '13px 14px',
                      borderRadius: 14,
                      color: active ? t.text : t.softText,
                      background: active ? t.itemHover : 'transparent',
                      fontSize: 15,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span>{link.label}</span>
                    <span style={{ color: active ? ORANGE : t.subtleText }}>
                      <ArrowRight />
                    </span>
                  </Link>
                )
              })}
            </div>

            <div
              style={{
                height: 1,
                background: t.line,
                margin: '14px 0',
              }}
            />

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = currentLang.code === lang.code

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang)}
                    style={{
                      border: `1px solid ${
                        selected ? t.orangeBorder : t.iconBorder
                      }`,
                      background: selected ? t.orangeSoft : t.iconBg,
                      color: selected ? ORANGE : t.softText,
                      borderRadius: 12,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: selected ? 700 : 600,
                    }}
                  >
                    <span>{lang.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <div aria-hidden="true" style={{ height: headerOffset }} />
    </>
  )
}
