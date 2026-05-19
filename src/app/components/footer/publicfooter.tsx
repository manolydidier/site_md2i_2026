'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTheme } from '@/app/context/ThemeContext'

const ORANGE = '#EF9F27'

const MD2I_LAT = -18.9189858
const MD2I_LNG = 47.5422889

const MD2I_ADDRESS = 'MD2I Madagascar, Lot VA 20 E Tsiadana, Antananarivo 101, Madagascar'
const MD2I_LOCATION_LABEL = 'MD2I Madagascar — Tsiadana, Antananarivo'
const MD2I_EMAIL = 'madagascar@md2i.eu'
const MD2I_PHONE_DISPLAY = '+261 20 22 627 26'
const MD2I_PHONE_HREF = '+261202262726'

const MD2I_MARKER_LOGO = '/logo.png'

const GOOGLE_MAP_QUERY = encodeURIComponent(`${MD2I_LAT},${MD2I_LNG}`)
const GOOGLE_MAP_PLACE_QUERY = encodeURIComponent('MD2I Madagascar')
const GOOGLE_MAP_PLACE_ID = 'ChIJ9zlRPv99DyERlaFmlacBd_c'

const GOOGLE_MAP_EMBED_URL = `https://www.google.com/maps?q=${GOOGLE_MAP_QUERY}&z=17&output=embed`
const GOOGLE_MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${GOOGLE_MAP_PLACE_QUERY}&query_place_id=${GOOGLE_MAP_PLACE_ID}`
const GOOGLE_MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${GOOGLE_MAP_QUERY}`

const LINKS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    color: '#3B82F6',
  },
  {
    href: '/services',
    label: 'Services',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    color: '#8B5CF6',
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    color: '#10B981',
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    color: '#F59E0B',
  },
  {
    href: '/a-propos',
    label: 'À propos',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    color: '#EC4899',
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: '#EF4444',
  },
  {
    href: '/contact-commercial',
    label: 'Contact commercial',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    color: ORANGE,
  },
]

const SERVICES = [
  { href: '/services#web', label: 'Développement web', icon: '⚡' },
  { href: '/services#mobile', label: 'Applications mobiles', icon: '📱' },
  { href: '/services#conseil', label: 'Conseil IT', icon: '💡' },
  { href: '/services#infogerance', label: 'Infogérance', icon: '🛡️' },
  { href: '/services#cyber', label: 'Cybersécurité', icon: '🔒' },
  { href: '/services#formation', label: 'Formation digitale', icon: '🎓' },
]

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: '#',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
  },
  {
    label: 'Facebook',
    href: '#',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  },
  {
    label: 'X',
    href: '#',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l16 16M20 4 4 20" /></svg>,
  },
  {
    label: 'Email',
    href: `mailto:${MD2I_EMAIL}`,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" /></svg>,
  },
]

type VisitorLocation = {
  latitude: number
  longitude: number
  accuracy?: number | null
}

type SubscribeResult = {
  type: 'created' | 'updated'
  title: string
  message: string
  email: string
  companyName?: string | null
}

function tokens(dark: boolean) {
  return {
    bg: dark ? '#0C0C10' : '#F7F7F9',
    border: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)',
    text: dark ? '#F4F1EC' : '#0D0E10',
    softText: dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.54)',
    subtleText: dark ? 'rgba(255,255,255,.30)' : 'rgba(0,0,0,.32)',
    cardBg: dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.92)',
    cardBorder: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    inputBg: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)',
    iconBg: dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
    iconBorder: dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.08)',
    orangeSoft: dark ? 'rgba(239,159,39,.13)' : 'rgba(239,159,39,.09)',
    orangeBorder: 'rgba(239,159,39,.30)',
    mapOverlay: dark
      ? 'linear-gradient(180deg, rgba(12,12,16,.10) 0%, rgba(12,12,16,.02) 28%, rgba(12,12,16,.18) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 28%, rgba(247,247,249,.24) 100%)',
  }
}

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current

    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function FooterSeparator({ dark }: { dark: boolean }) {
  return (
    <div className="mt-36" style={{ position: 'relative', height: 80, overflow: 'hidden', marginBottom: -2 }}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGradFooter" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ORANGE} stopOpacity="0.04" />
            <stop offset="50%" stopColor={ORANGE} stopOpacity="0.12" />
            <stop offset="100%" stopColor={ORANGE} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        <path
          d="M0,40 C200,80 400,0 600,40 C800,80 1000,10 1200,40 C1320,58 1380,50 1440,40 L1440,80 L0,80 Z"
          fill="url(#waveGradFooter)"
        />

        <path
          d="M0,52 C240,20 480,72 720,48 C960,24 1200,68 1440,52 L1440,80 L0,80 Z"
          fill={dark ? 'rgba(239,159,39,.04)' : 'rgba(239,159,39,.05)'}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${ORANGE}55, transparent)`,
        }}
      />
    </div>
  )
}

function buildDirectionsUrl(location?: VisitorLocation | null) {
  if (!location) return GOOGLE_MAP_DIRECTIONS_URL

  const origin = encodeURIComponent(`${location.latitude},${location.longitude}`)

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${GOOGLE_MAP_QUERY}`
}

export default function PublicFooter() {
  const { dark } = useTheme()

  const t = useMemo(() => tokens(dark), [dark])

  const [email, setEmail] = useState('')
  const [subscribeResult, setSubscribeResult] = useState<SubscribeResult | null>(null)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')

  const [visitorLocation, setVisitorLocation] = useState<VisitorLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')

  const { ref: rootRef, visible } = useFadeIn()

  const fadeStyle = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
  })

  const handleSubscribe = async () => {
    const cleanEmail = email.trim().toLowerCase()

    setSubscribeError('')
    setSubscribeResult(null)

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSubscribeError('Veuillez saisir une adresse email valide.')
      return
    }

    setSubscribeLoading(true)

    try {
      const res = await fetch('/api/public/newsletter-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          source: 'PUBLIC_FOOTER_NEWSLETTER',
          pageUrl: typeof window !== 'undefined' ? window.location.href : null,
          location: visitorLocation,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Impossible d’ajouter ce contact.')
      }

      const created = Boolean(data.created)

      setSubscribeResult({
        type: created ? 'created' : 'updated',
        title: created ? 'Bienvenue chez MD2I' : 'Contact déjà enregistré',
        message: created
          ? 'Votre email a bien été ajouté au CRM. Nous pourrons vous envoyer nos actualités, offres utiles et informations produits.'
          : 'Ce contact existait déjà dans le CRM. Ses informations ont été complétées et mises à jour.',
        email: data.contact?.email || cleanEmail,
        companyName: data.contact?.companyName || null,
      })

      setEmail('')

      setTimeout(() => setSubscribeResult(null), 7000)
    } catch (error) {
      setSubscribeError(
        error instanceof Error
          ? error.message
          : 'Erreur pendant l’inscription.'
      )
    } finally {
      setSubscribeLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    setLocationMessage('')

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationMessage('La géolocalisation n’est pas disponible sur ce navigateur.')

      window.open(GOOGLE_MAP_DIRECTIONS_URL, '_blank', 'noopener,noreferrer')

      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }

        setVisitorLocation(nextLocation)
        setLocationLoading(false)
        setLocationMessage('Position détectée. Ouverture de l’itinéraire Google Maps.')

        window.open(buildDirectionsUrl(nextLocation), '_blank', 'noopener,noreferrer')
      },
      () => {
        setLocationLoading(false)
        setLocationMessage('Localisation refusée. Ouverture de Google Maps sans position de départ.')

        window.open(GOOGLE_MAP_DIRECTIONS_URL, '_blank', 'noopener,noreferrer')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        .fnl-input:focus { outline: none; border-color: rgba(239,159,39,.45) !important; }
        .fnl-input::placeholder { color: ${t.subtleText}; }

        .fnl-btn:hover { opacity: .9; transform: translateY(-1px); }
        .fnl-btn:active { transform: scale(.97); }

        .fsoc:hover {
          border-color: rgba(239,159,39,.4) !important;
          background: rgba(239,159,39,.10) !important;
          color: ${ORANGE} !important;
          transform: translateY(-2px);
        }

        .fnavlink:hover { background: ${t.iconBg} !important; }
        .fnavlink:hover .fnavicon { opacity: 1 !important; transform: scale(1.12) !important; }
        .fnavlink:hover .fnavlabel { color: ${ORANGE} !important; }

        .flegal:hover { color: ${ORANGE} !important; }

        .badge-available { animation: pulseGreen 2.4s ease-in-out infinite; }

        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.35); }
          50% { box-shadow: 0 0 0 7px rgba(34,197,94,.0); }
        }

        .footer-map-card {
          position: relative;
          overflow: hidden;
          transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease;
        }

        .footer-map-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 50px rgba(0,0,0,.12);
          border-color: rgba(239,159,39,.22) !important;
        }

        .footer-map-frame {
          transition: transform .55s ease, filter .35s ease, opacity .35s ease;
        }

        .footer-map-card:hover .footer-map-frame {
          transform: scale(1.04);
          opacity: .96;
          filter: saturate(1.06) contrast(1.02);
        }

        .footer-contact-link {
          text-decoration: none;
          color: inherit;
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
        }

        .footer-contact-link:hover {
          transform: translateX(2px);
        }

        .footer-map-cta:hover {
          transform: translateY(-1px);
          background: ${ORANGE} !important;
          color: #fff !important;
        }

        .footer-location-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(239,159,39,.42) !important;
          background: rgba(239,159,39,.12) !important;
        }

        .footer-success-card {
          position: relative;
          overflow: hidden;
          padding: 14px 14px 14px 15px;
          border-radius: 16px;
          animation: footerSuccessIn .38s ease both;
        }

        .footer-success-card::before {
          content: '';
          position: absolute;
          inset: -60px auto auto -60px;
          width: 130px;
          height: 130px;
          border-radius: 999px;
          background: rgba(255,255,255,.22);
          pointer-events: none;
        }

        .footer-success-card::after {
          content: '';
          position: absolute;
          right: -35px;
          bottom: -45px;
          width: 110px;
          height: 110px;
          border-radius: 999px;
          background: rgba(255,255,255,.15);
          pointer-events: none;
        }

        .footer-success-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(255,255,255,.24);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @keyframes footerSuccessIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes md2iMarkerPulse {
          0%, 100% {
            opacity: .72;
            transform: scale(.92);
          }

          50% {
            opacity: .18;
            transform: scale(1.18);
          }
        }

        .footer-shell {
          max-width: 1460px;
          margin: 0 auto;
        }

        .fgrid-bottom {
          grid-template-columns:
            minmax(340px, 1.55fr)
            minmax(220px, .95fr)
            minmax(220px, .95fr)
            minmax(360px, 1.2fr) !important;
          align-items: start;
        }

        .footer-col-stretch {
          min-width: 0;
        }

        .footer-map-card {
          height: 100%;
        }

        .footer-newsletter-box {
          width: 100%;
        }

        @media (max-width: 1280px) {
          .footer-shell {
            max-width: 1280px;
          }

          .fgrid-bottom {
            grid-template-columns: repeat(2, minmax(280px, 1fr)) !important;
            gap: 28px !important;
          }

          .fbrand {
            grid-column: 1 / -1 !important;
            max-width: none !important;
          }

          .fside {
            grid-column: 1 / -1 !important;
          }
        }

        @media (max-width: 900px) {
          .footer-shell {
            max-width: 100%;
          }

          .fgrid-bottom {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }

          .fbrand,
          .fside {
            grid-column: auto !important;
          }

          .footer-map-top {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .footer-map-meta {
            flex-direction: column !important;
          }

          .footer-map-cta,
          .footer-location-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 680px) {
          .fbottom {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .footer-legal-links {
            gap: 12px !important;
          }

          .footer-brand-copy {
            max-width: none !important;
          }

          .footer-socials {
            width: 100%;
          }

          .footer-socials a {
            flex: 0 0 auto;
          }
        }

        @media (max-width: 520px) {
          .footer-root {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .footer-map-box {
            height: 240px !important;
          }

          .footer-brand-row {
            align-items: flex-start !important;
          }

          .footer-brand-title {
            font-size: 15px !important;
          }

          .footer-brand-subtitle {
            font-size: 10.5px !important;
          }
        }
      `}</style>

      <FooterSeparator dark={dark} />

      <footer
        id="public-footer"
        ref={rootRef}
        className="footer-root"
        style={{
          background: t.bg,
          borderTop: `1px solid ${t.border}`,
          padding: 'clamp(40px, 5vw, 64px) clamp(16px, 4vw, 64px) 28px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="footer-shell">
          <div style={{ height: 1, background: t.border, marginBottom: 40 }} />

          <div
            className="fgrid-bottom"
            style={{
              display: 'grid',
              gap: '40px 32px',
              marginBottom: 48,
            }}
          >
            <div className="fbrand footer-col-stretch" style={fadeStyle(0.06)}>
              <Link
                href="/"
                className="footer-brand-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: t.orangeSoft,
                    border: `1px solid ${t.orangeBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: ORANGE,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: 16,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    MD
                  </span>
                </div>

                <div>
                  <div
                    className="footer-brand-title"
                    style={{
                      color: t.text,
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    MD2I
                  </div>

                  <div
                    className="footer-brand-subtitle"
                    style={{
                      color: t.subtleText,
                      fontSize: 11,
                      fontWeight: 500,
                      marginTop: 3,
                    }}
                  >
                    Cabinet IT &amp; Solutions digitales
                  </div>
                </div>
              </Link>

              <div style={{ marginBottom: 16 }}>
                <span
                  className="badge-available"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: 'rgba(34,197,94,.10)',
                    border: '1px solid rgba(34,197,94,.28)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#22C55E',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#22C55E',
                      flexShrink: 0,
                    }}
                  />
                  Disponible pour nouveaux projets
                </span>
              </div>

              <p
                className="footer-brand-copy"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.78,
                  color: t.softText,
                  marginBottom: 22,
                  maxWidth: 420,
                }}
              >
                Nous accompagnons les entreprises dans leur transformation digitale — conseil,
                développement sur mesure, logiciels métiers et solutions IT innovantes à Madagascar
                et à l’international.
              </p>

              <div
                className="footer-socials"
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 18,
                }}
              >
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="fsoc"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: t.iconBg,
                      border: `1px solid ${t.iconBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: t.softText,
                      textDecoration: 'none',
                      transition: 'all .18s ease',
                    }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              <div
                className="footer-newsletter-box"
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: t.text,
                    marginBottom: 5,
                  }}
                >
                  Recevoir les actualités MD2I
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: t.softText,
                    lineHeight: 1.55,
                    marginBottom: 12,
                  }}
                >
                  Votre email sera ajouté au CRM comme nouveau contact. Le nom et
                  l’entreprise seront complétés automatiquement si possible.
                </p>

                {subscribeResult ? (
                  <div
                    className="footer-success-card"
                    style={{
                      background:
                        subscribeResult.type === 'created'
                          ? 'linear-gradient(135deg, #16A34A, #22C55E)'
                          : 'linear-gradient(135deg, #2563EB, #38BDF8)',
                      border:
                        subscribeResult.type === 'created'
                          ? '1px solid rgba(187,247,208,.55)'
                          : '1px solid rgba(191,219,254,.65)',
                      color: '#fff',
                      boxShadow:
                        subscribeResult.type === 'created'
                          ? '0 16px 36px rgba(34,197,94,.22)'
                          : '0 16px 36px rgba(37,99,235,.20)',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span className="footer-success-icon">
                        {subscribeResult.type === 'created' ? (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12a9 9 0 1 1-3-6.7" />
                            <path d="M21 3v6h-6" />
                          </svg>
                        )}
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13.5,
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {subscribeResult.title}
                        </p>

                        <p
                          style={{
                            margin: '5px 0 0',
                            fontSize: 12.3,
                            lineHeight: 1.55,
                            opacity: 0.92,
                            fontWeight: 500,
                          }}
                        >
                          {subscribeResult.message}
                        </p>

                        <div
                          style={{
                            marginTop: 10,
                            padding: '8px 10px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,.18)',
                            border: '1px solid rgba(255,255,255,.20)',
                            display: 'grid',
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              opacity: 0.8,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                            }}
                          >
                            Contact CRM
                          </span>

                          <strong
                            style={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              wordBreak: 'break-word',
                            }}
                          >
                            {subscribeResult.email}
                          </strong>

                          {subscribeResult.companyName && (
                            <span
                              style={{
                                fontSize: 12,
                                opacity: 0.86,
                                wordBreak: 'break-word',
                              }}
                            >
                              Entreprise détectée : {subscribeResult.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      className="fnl-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                      placeholder="votre@email.com"
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 11,
                        border: `1px solid ${t.cardBorder}`,
                        background: t.inputBg,
                        fontSize: 13,
                        color: t.text,
                        fontFamily: "'Inter', sans-serif",
                        transition: 'border .16s',
                      }}
                    />

                    <button
                      className="fnl-btn"
                      onClick={handleSubscribe}
                      disabled={subscribeLoading}
                      style={{
                        padding: '11px 14px',
                        borderRadius: 11,
                        background: ORANGE,
                        border: 'none',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: subscribeLoading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all .18s ease',
                        opacity: subscribeLoading ? 0.68 : 1,
                      }}
                    >
                      {subscribeLoading ? 'Ajout en cours...' : 'Ajouter mon email →'}
                    </button>

                    {subscribeError && (
                      <div
                        style={{
                          padding: '9px 11px',
                          borderRadius: 10,
                          background: 'rgba(239,68,68,.10)',
                          border: '1px solid rgba(239,68,68,.25)',
                          color: '#EF4444',
                          fontSize: 12,
                          lineHeight: 1.45,
                          fontWeight: 600,
                        }}
                      >
                        {subscribeError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="footer-col-stretch" style={fadeStyle(0.12)}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.subtleText,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Navigation
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="fnavlink"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 9px',
                      borderRadius: 11,
                      textDecoration: 'none',
                      background: 'transparent',
                      transition: 'background .16s ease',
                    }}
                  >
                    <span
                      className="fnavicon"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: `${link.color}18`,
                        border: `1px solid ${link.color}28`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: link.color,
                        flexShrink: 0,
                        opacity: 0.7,
                        transition: 'all .18s ease',
                      }}
                    >
                      {link.icon}
                    </span>

                    <span
                      className="fnavlabel"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: t.softText,
                        transition: 'color .16s ease',
                      }}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-col-stretch" style={fadeStyle(0.18)}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.subtleText,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Services
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {SERVICES.map((service) => (
                  <Link
                    key={service.href}
                    href={service.href}
                    className="fnavlink"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 9px',
                      borderRadius: 11,
                      textDecoration: 'none',
                      background: 'transparent',
                      transition: 'background .16s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: t.iconBg,
                        border: `1px solid ${t.iconBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {service.icon}
                    </span>

                    <span
                      className="fnavlabel"
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: t.softText,
                        transition: 'color .16s ease',
                      }}
                    >
                      {service.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="fside footer-col-stretch" style={{ ...fadeStyle(0.26), display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                className="footer-map-card"
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  borderRadius: 22,
                  overflow: 'hidden',
                  boxShadow: dark ? '0 10px 30px rgba(0,0,0,.22)' : '0 10px 30px rgba(15,23,42,.08)',
                }}
              >
                <div
                  className="footer-map-top"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '16px 16px 14px',
                    borderBottom: `1px solid ${t.cardBorder}`,
                    background: dark
                      ? 'linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))'
                      : 'linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.88))',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: t.text,
                      }}
                    >
                      Localisation MD2I
                    </p>

                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: t.softText,
                        lineHeight: 1.5,
                      }}
                    >
                      {MD2I_LOCATION_LABEL}
                    </p>
                  </div>

                  <a
                    href={GOOGLE_MAP_SEARCH_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-map-cta"
                    aria-label="Ouvrir MD2I dans Google Maps"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 12,
                      border: `1px solid ${t.orangeBorder}`,
                      background: t.orangeSoft,
                      color: ORANGE,
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      transition: 'all .2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 3h7v7" />
                      <path d="M10 14 21 3" />
                      <path d="M21 14v7h-7" />
                      <path d="M3 10V3h7" />
                      <path d="M3 21l7-7" />
                    </svg>
                    Google Maps
                  </a>
                </div>

                <div
                  className="footer-map-box"
                  style={{
                    position: 'relative',
                    height: 'clamp(260px, 26vw, 360px)',
                    overflow: 'hidden',
                    background: dark ? '#101216' : '#EEF2F7',
                  }}
                >
                  <iframe
                    title="Localisation MD2I Madagascar sur Google Maps"
                    src={GOOGLE_MAP_EMBED_URL}
                    className="footer-map-frame"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      opacity: 0.96,
                      pointerEvents: 'auto',
                    }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: t.mapOverlay,
                      pointerEvents: 'none',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      borderRadius: 999,
                      background: dark ? 'rgba(12,12,16,.72)' : 'rgba(255,255,255,.86)',
                      border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 700,
                      pointerEvents: 'none',
                      boxShadow: dark
                        ? '0 10px 24px rgba(0,0,0,.25)'
                        : '0 10px 24px rgba(15,23,42,.10)',
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239,159,39,.16)',
                        color: ORANGE,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={MD2I_MARKER_LOGO}
                        alt=""
                        width={18}
                        height={18}
                        style={{
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </span>
                    MD2I Madagascar
                  </div>

                  <a
                    href={GOOGLE_MAP_SEARCH_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ouvrir MD2I Madagascar dans Google Maps"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -82%)',
                      width: 58,
                      height: 58,
                      borderRadius: 20,
                      background: dark ? 'rgba(12,12,16,.86)' : 'rgba(255,255,255,.94)',
                      border: `2px solid ${ORANGE}`,
                      boxShadow: `0 18px 42px ${ORANGE}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      pointerEvents: 'auto',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: -10,
                        borderRadius: 28,
                        background: 'rgba(239,159,39,.16)',
                        animation: 'md2iMarkerPulse 2.4s ease-in-out infinite',
                      }}
                    />

                    <Image
                      src={MD2I_MARKER_LOGO}
                      alt="MD2I Madagascar"
                      width={38}
                      height={38}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />

                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: -13,
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: 18,
                        height: 18,
                        background: dark ? 'rgba(12,12,16,.86)' : 'rgba(255,255,255,.94)',
                        borderRight: `2px solid ${ORANGE}`,
                        borderBottom: `2px solid ${ORANGE}`,
                      }}
                    />
                  </a>

                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 'calc(50% + 30px)',
                      transform: 'translateX(-50%)',
                      padding: '7px 10px',
                      borderRadius: 999,
                      background: dark ? 'rgba(12,12,16,.78)' : 'rgba(255,255,255,.88)',
                      border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
                      color: t.text,
                      fontSize: 11.5,
                      fontWeight: 800,
                      boxShadow: dark
                        ? '0 10px 24px rgba(0,0,0,.24)'
                        : '0 10px 24px rgba(15,23,42,.10)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Tsiadana, Antananarivo
                  </div>
                </div>

                <div
                  className="footer-map-meta"
                  style={{
                    padding: '14px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="footer-location-btn"
                    style={{
                      minHeight: 42,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${t.cardBorder}`,
                      background: dark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.72)',
                      color: t.text,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      transition: 'all .18s ease',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    {locationLoading ? 'Localisation...' : 'Me localiser et ouvrir l’itinéraire'}
                  </button>

                  {locationMessage && (
                    <p
                      style={{
                        margin: 0,
                        color: t.softText,
                        fontSize: 11.5,
                        lineHeight: 1.45,
                      }}
                    >
                      {locationMessage}
                    </p>
                  )}

                  {[
                    {
                      color: '#10B981',
                      text: MD2I_ADDRESS,
                      href: GOOGLE_MAP_SEARCH_URL,
                      external: true,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      ),
                    },
                    {
                      color: '#3B82F6',
                      text: MD2I_EMAIL,
                      href: `mailto:${MD2I_EMAIL}`,
                      external: false,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <polyline points="2,4 12,13 22,4" />
                        </svg>
                      ),
                    },
                    {
                      color: '#F59E0B',
                      text: MD2I_PHONE_DISPLAY,
                      href: `tel:${MD2I_PHONE_HREF}`,
                      external: false,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      ),
                    },
                  ].map((item, i) => {
                    const content = (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 10px',
                          borderRadius: 12,
                          border: `1px solid ${dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}`,
                          background: dark ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.72)',
                        }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 9,
                            background: `${item.color}18`,
                            border: `1px solid ${item.color}28`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.color,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>

                        <span
                          style={{
                            fontSize: 12.5,
                            color: t.softText,
                            fontWeight: 500,
                            lineHeight: 1.45,
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.text}
                        </span>
                      </div>
                    )

                    return item.external ? (
                      <a
                        key={i}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="footer-contact-link"
                        style={{ textDecoration: 'none' }}
                      >
                        {content}
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={item.href}
                        className="footer-contact-link"
                        style={{ textDecoration: 'none' }}
                      >
                        {content}
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 22, ...fadeStyle(0.36) }}>
            <div
              className="fbottom"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <p style={{ fontSize: 12, color: t.subtleText }}>
                © {new Date().getFullYear()}{' '}
                <span style={{ color: ORANGE, fontWeight: 600 }}>MD2I</span>
                {' '}— Tous droits réservés. Conçu avec soin à Madagascar 🇲🇬
              </p>

              <div
                className="footer-legal-links"
                style={{
                  display: 'flex',
                  gap: 18,
                  flexWrap: 'wrap',
                }}
              >
                {['Mentions légales', 'Confidentialité', 'CGU'].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="flegal"
                    style={{
                      fontSize: 12,
                      color: t.subtleText,
                      textDecoration: 'none',
                      transition: 'color .16s ease',
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: t.orangeSoft,
                  color: ORANGE,
                  border: `1px solid ${t.orangeBorder}`,
                }}
              >
                v3.3
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}