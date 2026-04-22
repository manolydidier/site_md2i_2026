'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../context/ThemeContext'
import logo from '../../assets/logo.png'

const ORANGE = '#EF9F27'
const LOGO_SRC = logo

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

const LANGUAGES = [
  { code: 'FR', flag: '🇫🇷', label: 'Français' },
  { code: 'EN', flag: '🇬🇧', label: 'English' },
  { code: 'DE', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'MG', flag: '🇲🇬', label: 'Malagasy' },
]

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20" y1="20" x2="16.6" y2="16.6" />
  </svg>
)

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.6" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
  </svg>
)

const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.5 14.2A8.8 8.8 0 1 1 9.8 3.5 7.2 7.2 0 0 0 20.5 14.2z" />
  </svg>
)

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .22s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

function tokens(dark: boolean, scrolled: boolean) {
  return {
    shellBg: dark
      ? scrolled ? 'rgba(10,10,14,.90)' : 'rgba(10,10,14,.82)'
      : scrolled ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.88)',
    shellBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
    shellShadow: dark ? '0 14px 40px rgba(0,0,0,.22)' : '0 14px 40px rgba(0,0,0,.08)',
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

function SearchModal({
  open,
  onClose,
  dark,
}: {
  open: boolean
  onClose: () => void
  dark: boolean
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const t = tokens(dark, true)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const id = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  useEffect(() => {
    const root =
      (document.getElementById('__next') as HTMLElement | null) ??
      (document.body.firstElementChild as HTMLElement | null)

    if (!root) return

    if (open) {
      root.style.filter = 'blur(6px) brightness(.92)'
      root.style.transition = 'filter .22s ease'
      root.style.pointerEvents = 'none'
      document.body.style.overflow = 'hidden'
    } else {
      root.style.filter = ''
      root.style.pointerEvents = ''
      document.body.style.overflow = ''
    }

    return () => {
      root.style.filter = ''
      root.style.pointerEvents = ''
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const filtered = LINKS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: dark ? 'rgba(0,0,0,.24)' : 'rgba(80,80,100,.12)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 'clamp(56px, 12vh, 110px)',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 'min(620px, calc(100vw - 24px))',
          background: t.dropdownBg,
          border: `1px solid ${t.shellBorder}`,
          borderRadius: 22,
          boxShadow: dark ? '0 24px 70px rgba(0,0,0,.32)' : '0 24px 70px rgba(0,0,0,.10)',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: `1px solid ${t.line}` }}>
          <span style={{ color: ORANGE, display: 'flex' }}>
            <SearchIcon />
          </span>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 16,
              color: t.text,
              fontFamily: 'inherit',
            }}
          />

          <kbd style={{ fontSize: 11, color: t.subtleText, background: t.iconBg, border: `1px solid ${t.line}`, borderRadius: 8, padding: '4px 8px' }}>
            Échap
          </kbd>
        </div>

        <div style={{ padding: 8 }}>
          {query.length === 0 ? (
            <div style={{ padding: '20px 14px', color: t.subtleText, fontSize: 14 }}>
              Commencez à taper pour chercher dans le site.
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 14px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: t.text,
                  fontSize: 15,
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: t.subtleText }}>
                  <ArrowRight />
                </span>
              </Link>
            ))
          ) : (
            <div style={{ padding: '20px 14px', color: t.subtleText, fontSize: 14 }}>
              Aucun résultat pour "{query}".
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function NavToggleButton({
  navbarVisible,
  onClick,
  dark,
}: {
  navbarVisible: boolean
  onClick: () => void
  dark: boolean
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addRipple = () => {
    const id = Date.now()
    setRipples((prev) => [...prev, id])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r !== id)), 600)
  }

  const handleClick = () => {
    addRipple()
    onClick()
  }

  const showTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltipVisible(true)
    tooltipTimer.current = setTimeout(() => setTooltipVisible(false), 1800)
  }

  const hideTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => setTooltipVisible(false), 400)
  }

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 299,
          background: dark ? 'rgba(16,16,22,.97)' : 'rgba(255,255,255,.98)',
          border: `1px solid ${dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)'}`,
          borderRadius: 12,
          padding: '7px 13px',
          fontSize: 12,
          fontWeight: 500,
          color: dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)',
          whiteSpace: 'nowrap',
          boxShadow: dark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)',
          fontFamily: "'Inter', sans-serif",
          pointerEvents: 'none',
          opacity: tooltipVisible ? 1 : 0,
          transform: tooltipVisible ? 'translateY(0)' : 'translateY(5px)',
          transition: 'opacity .2s ease, transform .2s ease',
        }}
      >
        {navbarVisible ? 'Masquer la navigation' : 'Afficher la navigation'}
      </div>

      <button
        onClick={handleClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        aria-label={navbarVisible ? 'Masquer la navigation' : 'Afficher la navigation'}
        style={{
          position: 'fixed',
          top: 90,
          right: 28,
          zIndex: 300,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: ORANGE,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(239,159,39,.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          transition: 'transform .18s ease, box-shadow .18s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 26px rgba(239,159,39,.6)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,159,39,.5)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.94)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
        }}
      >
        {ripples.map((id) => (
          <span
            key={id}
            style={{
              position: 'absolute',
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.32)',
              animation: 'navToggleRipple .55s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        ))}

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: navbarVisible ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform .32s cubic-bezier(0.34, 1.26, 0.64, 1)',
          }}
        >
          <ChevronUpIcon />
        </span>
      </button>
    </>,
    document.body
  )
}

export default function PublicNavbar() {
  const pathname = usePathname()
  const { dark, toggleTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0])
  const [scrolled, setScrolled] = useState(false)

  const [visible, setVisible] = useState(true)
  const [manualHidden, setManualHidden] = useState(false)

  const [logoError, setLogoError] = useState(false)

  const langRef = useRef<HTMLDivElement>(null)
  const lastScroll = useRef(0)

  const t = useMemo(() => tokens(dark, scrolled), [dark, scrolled])

  const navbarShown = visible && !manualHidden

  useEffect(() => {
    setMounted(true)
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
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setLangOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) return
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, searchOpen])

  const handleLangSelect = useCallback((lang: (typeof LANGUAGES)[0]) => {
    setCurrentLang(lang)
    setLangOpen(false)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navHeight = 68
  const navTop = 12
  const headerOffset = navHeight + navTop + 8

  const iconBtn = useMemo(
    () => ({
      width: 40,
      height: 40,
      borderRadius: 14,
      border: `1px solid ${t.iconBorder}`,
      background: t.iconBg,
      color: t.softText,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all .18s ease',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
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

        @keyframes navToggleRipple {
          to { transform: scale(2.8); opacity: 0; }
        }

        @keyframes navToggleBtnPop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }

        .pro-nav-link {
          position: relative;
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          transition: all .18s ease;
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

        .pro-icon:hover {
          transform: translateY(-1px);
          color: ${t.text} !important;
          background: ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'} !important;
          border-color: ${dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'} !important;
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} dark={dark} />

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
          transform: navbarShown ? 'translate3d(0,0,0)' : 'translate3d(0,-120%,0)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
            <Link
              href="/"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, color: t.text, minWidth: 0 }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)',
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
                    style={{ width: 40, height: 40, objectFit: 'contain' }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span style={{ color: ORANGE, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15 }}>
                    MD
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
                  Cabinet IT &amp; Solutions digitales
                </span>
              </div>
            </Link>

            <div className="pro-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {LINKS.map((link) => {
                const active = isActive(link.href)

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="pro-icon" onClick={() => setSearchOpen(true)} aria-label="Recherche" style={iconBtn}>
              <SearchIcon />
            </button>

            <button className="pro-icon" onClick={toggleTheme} aria-label={dark ? 'Mode clair' : 'Mode sombre'} style={iconBtn}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                className="pro-icon"
                onClick={() => setLangOpen((v) => !v)}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                style={{ ...iconBtn, width: 'auto', padding: '0 12px', gap: 8, color: t.text, fontSize: 13, fontWeight: 600 }}
              >
                <span style={{ fontSize: 15 }}>{currentLang.flag}</span>
                <span>{currentLang.code}</span>
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
                    boxShadow: dark ? '0 18px 40px rgba(0,0,0,.26)' : '0 18px 40px rgba(0,0,0,.10)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}
                >
                  {LANGUAGES.map((lang) => {
                    const selected = currentLang.code === lang.code

                    return (
                      <li
                        key={lang.code}
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
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <button
              className="pro-mobile-toggle pro-icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              style={{ ...iconBtn, display: 'none', flexDirection: 'column', gap: 4 }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 16,
                    height: 1.8,
                    borderRadius: 999,
                    background: mobileOpen ? ORANGE : t.text,
                    transition: 'all .2s ease',
                    transform:
                      mobileOpen && i === 0
                        ? 'translateY(5.8px) rotate(45deg)'
                        : mobileOpen && i === 2
                          ? 'translateY(-5.8px) rotate(-45deg)'
                          : mobileOpen && i === 1
                            ? 'scaleX(0)'
                            : 'none',
                    opacity: mobileOpen && i === 1 ? 0 : 1,
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
              boxShadow: dark ? '0 18px 42px rgba(0,0,0,.24)' : '0 18px 42px rgba(0,0,0,.10)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: 14,
              animation: 'mobilePanelIn .22s ease',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              {LINKS.map((link) => {
                const active = isActive(link.href)

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

            <div style={{ height: 1, background: t.line, margin: '14px 0' }} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LANGUAGES.map((lang) => {
                const selected = currentLang.code === lang.code

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLangSelect(lang)}
                    style={{
                      border: `1px solid ${selected ? t.orangeBorder : t.iconBorder}`,
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
                    <span>{lang.flag}</span>
                    <span>{lang.code}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <div aria-hidden="true" style={{ height: headerOffset }} />

      {/* Décommente si tu veux réactiver le bouton flottant
      <NavToggleButton
        navbarVisible={navbarShown}
        onClick={() => setManualHidden((v) => !v)}
        dark={dark}
      />
      */}
    </>
  )
}