'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  BriefcaseBusiness,
  ExternalLink,
  Globe2,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Newspaper,
  Package,
  Phone,
  User,
  type LucideIcon,
} from 'lucide-react'

import { useTheme } from '@/app/context/ThemeContext'

const ORANGE = '#EF9F27'

const MD2I_LAT = -18.9189858
const MD2I_LNG = 47.5422889

const MD2I_ADDRESS =
  'MD2I Madagascar, Lot VA 20 E Tsiadana, Antananarivo 101, Madagascar'
const MD2I_LOCATION_LABEL = 'MD2I Madagascar — Tsiadana, Antananarivo'
const MD2I_EMAIL = 'madagascar@md2i.eu'
const MD2I_PHONE_DISPLAY = '+261 20 22 627 26'
const MD2I_PHONE_HREF = '+261202262726'
const MD2I_WEBSITE_URL = 'https://md2i.eu'
const MD2I_MARKER_LOGO = '/logo.png'

const GOOGLE_MAP_QUERY = encodeURIComponent(`${MD2I_LAT},${MD2I_LNG}`)
const GOOGLE_MAP_PLACE_QUERY = encodeURIComponent(
  `MD2I Madagascar ${MD2I_LAT},${MD2I_LNG}`
)

const GOOGLE_MAP_EMBED_URL = `https://www.google.com/maps?q=${GOOGLE_MAP_QUERY}&z=17&output=embed`
const GOOGLE_MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${GOOGLE_MAP_PLACE_QUERY}`
const GOOGLE_MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${GOOGLE_MAP_QUERY}`

const SOCIAL_LINKEDIN_URL = process.env.NEXT_PUBLIC_LINKEDIN_URL || ''
const SOCIAL_FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || ''
const SOCIAL_X_URL = process.env.NEXT_PUBLIC_X_URL || ''

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

type FooterLink = {
  href: string
  label: string
  key: string
  color: string
  icon: LucideIcon
}

type BasicLink = {
  href: string
  label: string
  key: string
  external?: boolean
  icon?: ReactNode
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  )
}

const LINKS: FooterLink[] = [
  {
    href: '/',
    label: 'Accueil',
    key: 'home',
    icon: Home,
    color: '#3B82F6',
  },
  {
    href: '/services',
    label: 'Services',
    key: 'services',
    icon: BriefcaseBusiness,
    color: '#8B5CF6',
  },
  {
    href: '/produits',
    label: 'Produits',
    key: 'products',
    icon: Package,
    color: ORANGE,
  },
  {
    href: '/reference',
    label: 'Références',
    key: 'references',
    icon: BriefcaseBusiness,
    color: '#10B981',
  },
  {
    href: '/blog',
    label: 'Blog',
    key: 'blog',
    icon: Newspaper,
    color: '#F59E0B',
  },
  {
    href: '/a-propos',
    label: 'À propos',
    key: 'about',
    icon: User,
    color: '#EC4899',
  },
  {
    href: '/contact',
    label: 'Contact',
    key: 'contact',
    icon: MessageCircle,
    color: '#EF4444',
  },
  {
    href: '/contact-commercial',
    label: 'Contact commercial',
    key: 'sales',
    icon: Activity,
    color: ORANGE,
  },
]

const QUICK_LINKS: BasicLink[] = [
  {
    href: '/produits',
    label: 'Catalogue produits',
    key: 'products',
    icon: <Package size={14} />,
  },
  {
    href: '/services',
    label: 'Voir nos services',
    key: 'services',
    icon: <BriefcaseBusiness size={14} />,
  },
  {
    href: '/contact-commercial',
    label: 'Demander un devis',
    key: 'quote',
    icon: <ExternalLink size={14} />,
  },
  {
    href: '/contact-commercial?requestType=DEMO',
    label: 'Demander une démo',
    key: 'demo',
    icon: <ExternalLink size={14} />,
  },
  {
    href: '/contact',
    label: 'Nous contacter',
    key: 'contact',
    icon: <MessageCircle size={14} />,
  },
]

const BOTTOM_LINKS: BasicLink[] = [
  {
    href: '/contact',
    label: 'Contact',
    key: 'contact',
  },
  {
    href: '/contact-commercial',
    label: 'Contact commercial',
    key: 'sales',
  },
  {
    href: '/produits',
    label: 'Produits',
    key: 'products',
  },
]

// const SOURCE_LINKS: BasicLink[] = [
//   {
//     href: MD2I_WEBSITE_URL,
//     label: 'Site officiel MD2I',
//     key: 'officialSite',
//     external: true,
//     icon: <Globe2 size={14} />,
//   },
//   {
//     href: GOOGLE_MAP_SEARCH_URL,
//     label: 'Fiche Google Maps',
//     key: 'googleMaps',
//     external: true,
//     icon: <MapPin size={14} />,
//   },
//   {
//     href: GOOGLE_MAP_DIRECTIONS_URL,
//     label: 'Itinéraire Google Maps',
//     key: 'directions',
//     external: true,
//     icon: <Navigation size={14} />,
//   },
//   {
//     href: `mailto:${MD2I_EMAIL}`,
//     label: 'Email MD2I Madagascar',
//     key: 'email',
//     icon: <Mail size={14} />,
//   },
// ]

const RAW_SOCIALS = [
  {
    label: 'Site web',
    href: MD2I_WEBSITE_URL,
    icon: <Globe2 size={15} />,
  },
  {
    label: 'LinkedIn',
    href: SOCIAL_LINKEDIN_URL,
    icon: <LinkedInIcon />,
  },
  {
    label: 'Facebook',
    href: SOCIAL_FACEBOOK_URL,
    icon: <FacebookIcon />,
  },
  {
    label: 'X',
    href: SOCIAL_X_URL,
    icon: <XIcon />,
  },
  {
    label: 'Email',
    href: `mailto:${MD2I_EMAIL}`,
    icon: <Mail size={15} />,
  },
]

function tokens(dark: boolean) {
  return {
    bg: dark ? '#0C0C10' : '#F8FAFC',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    text: dark ? '#F8FAFC' : '#0F172A',
    softText: dark ? 'rgba(248,250,252,.68)' : '#475569',
    subtleText: dark ? 'rgba(248,250,252,.42)' : '#64748B',
    mutedText: dark ? 'rgba(248,250,252,.32)' : '#94A3B8',
    cardBg: dark ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.86)',
    cardBgSolid: dark ? '#12141A' : '#FFFFFF',
    cardBorder: dark ? 'rgba(255,255,255,.09)' : 'rgba(15,23,42,.09)',
    inputBg: dark ? 'rgba(255,255,255,.055)' : '#F8FAFC',
    iconBg: dark ? 'rgba(255,255,255,.055)' : '#F8FAFC',
    iconBorder: dark ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)',
    orangeSoft: dark ? 'rgba(239,159,39,.14)' : 'rgba(239,159,39,.10)',
    orangeBorder: 'rgba(239,159,39,.32)',
    shadow: dark
      ? '0 18px 55px rgba(0,0,0,.30)'
      : '0 18px 50px rgba(15,23,42,.08)',
    mapOverlay: dark
      ? 'linear-gradient(180deg, rgba(12,12,16,.10) 0%, rgba(12,12,16,.02) 28%, rgba(12,12,16,.20) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.01) 32%, rgba(248,250,252,.22) 100%)',
  }
}

function useFadeIn() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.08,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function buildDirectionsUrl(location?: VisitorLocation | null) {
  if (!location) return GOOGLE_MAP_DIRECTIONS_URL

  const origin = encodeURIComponent(`${location.latitude},${location.longitude}`)

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${GOOGLE_MAP_QUERY}`
}

export default function PublicFooter() {
  const { dark } = useTheme()
  const { t: translate } = useTranslation()

  const palette = useMemo(() => tokens(dark), [dark])

  const tr = (
    key: string,
    defaultValue: string,
    options?: Record<string, string | number | null | undefined>
  ) =>
    translate(key, {
      defaultValue,
      ...(options || {}),
    }) as string

  const links = useMemo(
    () =>
      LINKS.map((link) => ({
        ...link,
        label: translate(`footer.links.${link.key}`, {
          defaultValue: link.label,
        }) as string,
      })),
    [translate]
  )

  const quickLinks = useMemo(
    () =>
      QUICK_LINKS.map((link) => ({
        ...link,
        label: translate(`footer.quickLinks.${link.key}`, {
          defaultValue: link.label,
        }) as string,
      })),
    [translate]
  )

  // const sourceLinks = useMemo(
  //   () =>
  //     SOURCE_LINKS.map((link) => ({
  //       ...link,
  //       label: translate(`footer.sourceLinks.${link.key}`, {
  //         defaultValue: link.label,
  //       }) as string,
  //     })),
  //   [translate]
  // )

  const bottomLinks = useMemo(
    () =>
      BOTTOM_LINKS.map((link) => ({
        ...link,
        label: translate(`footer.bottomLinks.${link.key}`, {
          defaultValue: link.label,
        }) as string,
      })),
    [translate]
  )

  const socials = useMemo(
    () => RAW_SOCIALS.filter((social) => social.href && social.href !== '#'),
    []
  )

  const [email, setEmail] = useState('')
  const [newsletterWebsite, setNewsletterWebsite] = useState('')
  const [newsletterStartedAt, setNewsletterStartedAt] = useState(() => Date.now())
  const [subscribeResult, setSubscribeResult] = useState<SubscribeResult | null>(null)
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')

  const [visitorLocation, setVisitorLocation] = useState<VisitorLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')

  const { ref: rootRef, visible } = useFadeIn()

  const rootStyle = {
    '--ft-bg': palette.bg,
    '--ft-border': palette.border,
    '--ft-text': palette.text,
    '--ft-soft': palette.softText,
    '--ft-subtle': palette.subtleText,
    '--ft-muted': palette.mutedText,
    '--ft-card': palette.cardBg,
    '--ft-card-solid': palette.cardBgSolid,
    '--ft-card-border': palette.cardBorder,
    '--ft-input': palette.inputBg,
    '--ft-icon': palette.iconBg,
    '--ft-icon-border': palette.iconBorder,
    '--ft-orange-soft': palette.orangeSoft,
    '--ft-orange-border': palette.orangeBorder,
    '--ft-shadow': palette.shadow,
    '--ft-map-overlay': palette.mapOverlay,
    '--ft-orange': ORANGE,
  } as CSSProperties

  const fadeStyle = (delay: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s`,
  })

  const handleSubscribe = async () => {
    const cleanEmail = email.trim().toLowerCase()

    setSubscribeError('')
    setSubscribeResult(null)

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSubscribeError(
        tr(
          'footer.newsletter.validation.email',
          'Veuillez saisir une adresse email valide.'
        )
      )
      return
    }

    setSubscribeLoading(true)

    try {
      const response = await fetch('/api/public/newsletter-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: cleanEmail,
          source: 'PUBLIC_FOOTER_NEWSLETTER',
          pageUrl: typeof window !== 'undefined' ? window.location.href : null,
          location: visitorLocation,
          website: newsletterWebsite,
          submittedAt: newsletterStartedAt,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            tr('footer.newsletter.errors.add', 'Impossible d’ajouter ce contact.')
        )
      }

      const created = Boolean(data.created)

      setSubscribeResult({
        type: created ? 'created' : 'updated',
        title: created
          ? tr('footer.newsletter.success.createdTitle', 'Bienvenue chez MD2I')
          : tr('footer.newsletter.success.updatedTitle', 'Contact déjà enregistré'),
        message: created
          ? tr(
              'footer.newsletter.success.createdMessage',
              'Votre email a bien été ajouté au CRM.'
            )
          : tr(
              'footer.newsletter.success.updatedMessage',
              'Ce contact existait déjà. Ses informations ont été mises à jour.'
            ),
        email: data.contact?.email || cleanEmail,
        companyName: data.contact?.companyName || null,
      })

      setEmail('')
      setNewsletterWebsite('')
      setNewsletterStartedAt(Date.now())

      window.setTimeout(() => setSubscribeResult(null), 7000)
    } catch (error) {
      setSubscribeError(
        error instanceof Error
          ? error.message
          : tr('footer.newsletter.errors.generic', 'Erreur pendant l’inscription.')
      )
    } finally {
      setSubscribeLoading(false)
    }
  }

  const handleUseMyLocation = () => {
    setLocationMessage('')

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationMessage(
        tr(
          'footer.location.unavailable',
          'La géolocalisation n’est pas disponible sur ce navigateur.'
        )
      )

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
        setLocationMessage(
          tr(
            'footer.location.detected',
            'Position détectée. Ouverture de l’itinéraire Google Maps.'
          )
        )

        window.open(buildDirectionsUrl(nextLocation), '_blank', 'noopener,noreferrer')
      },
      () => {
        setLocationLoading(false)
        setLocationMessage(
          tr(
            'footer.location.denied',
            'Localisation refusée. Ouverture de Google Maps sans position de départ.'
          )
        )

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .footer-root {
          background:
            radial-gradient(circle at 10% 0%, rgba(239, 159, 39, .075), transparent 28%),
            linear-gradient(180deg, var(--ft-bg), var(--ft-bg));
          border-top: 1px solid var(--ft-border);
          padding: clamp(38px, 5vw, 62px) clamp(16px, 4vw, 64px) 26px;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--ft-text);
        }

        .footer-root *,
        .footer-root *::before,
        .footer-root *::after {
          box-sizing: border-box;
        }

        .footer-shell {
          width: min(1480px, 100%);
          margin: 0 auto;
        }

        .footer-topline {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--ft-border), transparent);
          margin-bottom: 34px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns:
            minmax(320px, 1.2fr)
            minmax(205px, .74fr)
            minmax(245px, .84fr)
            minmax(650px, 1.55fr);
          gap: 28px;
          align-items: start;
          margin-bottom: 42px;
        }

        .footer-brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 15px;
        }

        .footer-logo-box {
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: var(--ft-orange-soft);
          border: 1px solid var(--ft-orange-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .footer-logo-box img {
          width: 34px;
          height: 34px;
          object-fit: contain;
          display: block;
        }

        .footer-brand-title {
          display: block;
          color: var(--ft-text);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.03em;
          line-height: 1.05;
        }

        .footer-brand-subtitle {
          display: block;
          color: var(--ft-subtle);
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 4px;
        }

        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 11px;
          border-radius: 999px;
          background: rgba(34,197,94,.10);
          border: 1px solid rgba(34,197,94,.25);
          color: #16A34A;
          font-size: 11.8px;
          font-weight: 750;
          margin-bottom: 15px;
        }

        .footer-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 0 4px rgba(34,197,94,.10);
          flex-shrink: 0;
        }

        .footer-brand-copy {
          max-width: 440px;
          margin: 0 0 18px;
          color: var(--ft-soft);
          font-size: 13.4px;
          line-height: 1.78;
          font-weight: 500;
        }

        .footer-socials {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .footer-social {
          width: 39px;
          height: 39px;
          border-radius: 13px;
          background: var(--ft-icon);
          border: 1px solid var(--ft-icon-border);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--ft-soft);
          text-decoration: none;
          transition: transform .18s ease, color .18s ease, background .18s ease, border-color .18s ease;
        }

        .footer-social:hover {
          transform: translateY(-2px);
          color: var(--ft-orange);
          background: var(--ft-orange-soft);
          border-color: var(--ft-orange-border);
        }

        .footer-card {
          background: var(--ft-card);
          border: 1px solid var(--ft-card-border);
          border-radius: 18px;
          box-shadow: 0 10px 32px rgba(15, 23, 42, .045);
        }

        .footer-newsletter {
          padding: 17px;
        }

        .footer-newsletter-title {
          margin: 0 0 5px;
          color: var(--ft-text);
          font-size: 13.3px;
          font-weight: 800;
        }

        .footer-newsletter-text {
          margin: 0 0 12px;
          color: var(--ft-soft);
          font-size: 12.2px;
          line-height: 1.58;
          font-weight: 500;
        }

        .footer-field-hidden {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        .footer-input {
          width: 100%;
          min-height: 42px;
          padding: 0 13px;
          border-radius: 12px;
          border: 1px solid var(--ft-card-border);
          background: var(--ft-input);
          color: var(--ft-text);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
        }

        .footer-input::placeholder {
          color: var(--ft-muted);
        }

        .footer-input:focus {
          border-color: rgba(239,159,39,.45);
          background: var(--ft-card-solid);
          box-shadow: 0 0 0 4px rgba(239,159,39,.12);
        }

        .footer-btn {
          width: 100%;
          min-height: 42px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--ft-orange), #d8891e);
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
          box-shadow: 0 12px 24px rgba(239,159,39,.18);
        }

        .footer-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(239,159,39,.24);
        }

        .footer-btn:disabled {
          cursor: not-allowed;
          opacity: .68;
        }

        .footer-notice-error {
          padding: 9px 11px;
          border-radius: 12px;
          background: rgba(239,68,68,.10);
          border: 1px solid rgba(239,68,68,.22);
          color: #EF4444;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 650;
        }

        .footer-success-card {
          position: relative;
          overflow: hidden;
          padding: 14px;
          border-radius: 16px;
          color: #fff;
          animation: footerSuccessIn .32s ease both;
        }

        .footer-success-card.created {
          background: linear-gradient(135deg, #16A34A, #22C55E);
          border: 1px solid rgba(187,247,208,.55);
          box-shadow: 0 16px 36px rgba(34,197,94,.20);
        }

        .footer-success-card.updated {
          background: linear-gradient(135deg, #2563EB, #38BDF8);
          border: 1px solid rgba(191,219,254,.65);
          box-shadow: 0 16px 36px rgba(37,99,235,.18);
        }

        .footer-success-layout {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 12px;
          align-items: flex-start;
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

        .footer-success-title {
          margin: 0;
          font-size: 13.5px;
          font-weight: 850;
        }

        .footer-success-text {
          margin: 5px 0 0;
          font-size: 12.2px;
          line-height: 1.55;
          opacity: .92;
          font-weight: 500;
        }

        .footer-success-meta {
          margin-top: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(255,255,255,.17);
          border: 1px solid rgba(255,255,255,.20);
          display: grid;
          gap: 3px;
        }

        .footer-success-meta span {
          font-size: 10.8px;
          opacity: .8;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .footer-success-meta strong {
          font-size: 12.5px;
          font-weight: 850;
          word-break: break-word;
        }

        .footer-col-title {
          margin: 0 0 14px;
          color: var(--ft-subtle);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .footer-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 9px;
          border-radius: 12px;
          text-decoration: none;
          color: var(--ft-soft);
          transition: background .16s ease, color .16s ease, transform .16s ease;
        }

        .footer-link:hover {
          background: var(--ft-icon);
          color: var(--ft-orange);
          transform: translateX(2px);
        }

        .footer-link-icon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform .16s ease, opacity .16s ease;
        }

        .footer-link:hover .footer-link-icon {
          transform: scale(1.06);
          opacity: 1;
        }

        .footer-link-label {
          font-size: 13.3px;
          font-weight: 600;
          line-height: 1.25;
        }

        .footer-source-block {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--ft-border);
        }

        .footer-map-card {
          overflow: hidden;
          border-radius: 22px;
          background: var(--ft-card);
          border: 1px solid var(--ft-card-border);
          box-shadow: var(--ft-shadow);
        }

        .footer-map-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 15px 13px;
          border-bottom: 1px solid var(--ft-card-border);
          background: var(--ft-card-solid);
        }

        .footer-map-title {
          margin: 0;
          color: var(--ft-text);
          font-size: 13px;
          font-weight: 850;
        }

        .footer-map-subtitle {
          margin: 4px 0 0;
          color: var(--ft-soft);
          font-size: 12px;
          line-height: 1.48;
          font-weight: 500;
        }

        .footer-map-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid var(--ft-orange-border);
          background: var(--ft-orange-soft);
          color: var(--ft-orange);
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          transition: transform .18s ease, background .18s ease, color .18s ease;
          white-space: nowrap;
        }

        .footer-map-cta:hover {
          transform: translateY(-1px);
          background: var(--ft-orange);
          color: #fff;
        }

        .footer-map-content {
          display: grid;
          grid-template-columns: minmax(320px, 1.35fr) minmax(280px, .85fr);
          min-height: 350px;
        }

        .footer-map-box {
          position: relative;
          min-height: 350px;
          overflow: hidden;
          background: #EEF2F7;
          border-right: 1px solid var(--ft-card-border);
        }

        .footer-map-frame {
          width: 100%;
          height: 100%;
          min-height: 350px;
          border: 0;
          opacity: .96;
          transition: transform .55s ease, filter .35s ease;
        }

        .footer-map-card:hover .footer-map-frame {
          transform: scale(1.025);
          filter: saturate(1.04) contrast(1.02);
        }

        .footer-map-overlay {
          position: absolute;
          inset: 0;
          background: var(--ft-map-overlay);
          pointer-events: none;
        }

        .footer-map-chip {
          position: absolute;
          left: 14px;
          top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(255,255,255,.88);
          border: 1px solid rgba(15,23,42,.08);
          backdrop-filter: blur(10px);
          color: #0F172A;
          font-size: 12px;
          font-weight: 800;
          pointer-events: none;
          box-shadow: 0 10px 24px rgba(15,23,42,.10);
        }

        .footer-root[data-theme="dark"] .footer-map-chip {
          background: rgba(12,12,16,.76);
          color: #F8FAFC;
          border-color: rgba(255,255,255,.10);
        }

        .footer-map-chip-logo {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239,159,39,.16);
          overflow: hidden;
          flex-shrink: 0;
        }

        .footer-map-chip-logo img {
          width: 18px;
          height: 18px;
          object-fit: contain;
          display: block;
        }

        .footer-map-marker {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -82%);
          width: 58px;
          height: 58px;
          border-radius: 20px;
          background: rgba(255,255,255,.94);
          border: 2px solid var(--ft-orange);
          box-shadow: 0 18px 42px rgba(239,159,39,.34);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          pointer-events: auto;
        }

        .footer-root[data-theme="dark"] .footer-map-marker {
          background: rgba(12,12,16,.88);
        }

        .footer-map-marker-pulse {
          position: absolute;
          inset: -10px;
          border-radius: 28px;
          background: rgba(239,159,39,.16);
          animation: md2iMarkerPulse 2.4s ease-in-out infinite;
        }

        .footer-map-marker img {
          position: relative;
          z-index: 2;
          width: 38px;
          height: 38px;
          object-fit: contain;
          display: block;
        }

        .footer-map-marker::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -13px;
          transform: translateX(-50%) rotate(45deg);
          width: 18px;
          height: 18px;
          background: inherit;
          border-right: 2px solid var(--ft-orange);
          border-bottom: 2px solid var(--ft-orange);
        }

        .footer-map-label {
          position: absolute;
          left: 50%;
          top: calc(50% + 30px);
          transform: translateX(-50%);
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.90);
          border: 1px solid rgba(15,23,42,.07);
          color: #0F172A;
          font-size: 11.5px;
          font-weight: 850;
          box-shadow: 0 10px 24px rgba(15,23,42,.10);
          backdrop-filter: blur(10px);
          pointer-events: none;
          white-space: nowrap;
        }

        .footer-root[data-theme="dark"] .footer-map-label {
          background: rgba(12,12,16,.80);
          color: #F8FAFC;
          border-color: rgba(255,255,255,.10);
        }

        .footer-map-meta {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--ft-card-solid);
        }

        .footer-contact-title {
          margin: 0 0 2px;
          color: var(--ft-text);
          font-size: 13px;
          font-weight: 850;
        }

        .footer-contact-subtitle {
          margin: 0 0 6px;
          color: var(--ft-soft);
          font-size: 12px;
          line-height: 1.5;
          font-weight: 500;
        }

        .footer-location-btn {
          min-height: 42px;
          padding: 10px 12px;
          border-radius: 13px;
          border: 1px solid var(--ft-card-border);
          background: var(--ft-icon);
          color: var(--ft-text);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 800;
          font-family: inherit;
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
        }

        .footer-location-btn:hover {
          transform: translateY(-1px);
          border-color: var(--ft-orange-border);
          background: var(--ft-orange-soft);
        }

        .footer-location-message {
          margin: 0;
          color: var(--ft-soft);
          font-size: 11.5px;
          line-height: 1.45;
        }

        .footer-contact-list {
          display: grid;
          gap: 9px;
          margin-top: 2px;
        }

        .footer-contact-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: transform .18s ease;
        }

        .footer-contact-link:hover {
          transform: translateX(2px);
        }

        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 13px;
          border: 1px solid var(--ft-card-border);
          background: var(--ft-card);
        }

        .footer-contact-icon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .footer-contact-text {
          color: var(--ft-soft);
          font-size: 12.4px;
          font-weight: 600;
          line-height: 1.45;
          word-break: break-word;
        }

        .footer-bottom {
          border-top: 1px solid var(--ft-border);
          padding-top: 20px;
        }

        .footer-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-copy {
          margin: 0;
          color: var(--ft-subtle);
          font-size: 12px;
          line-height: 1.5;
        }

        .footer-bottom-links {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .footer-bottom-link {
          color: var(--ft-subtle);
          font-size: 12px;
          text-decoration: none;
          transition: color .16s ease;
        }

        .footer-bottom-link:hover {
          color: var(--ft-orange);
        }

        .footer-version {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--ft-orange-soft);
          color: var(--ft-orange);
          border: 1px solid var(--ft-orange-border);
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

        @media (max-width: 1480px) {
          .footer-grid {
            grid-template-columns: minmax(330px, 1.25fr) repeat(2, minmax(220px, 1fr));
          }

          .footer-side {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 980px) {
          .footer-grid {
            grid-template-columns: repeat(2, minmax(260px, 1fr));
            gap: 26px;
          }

          .footer-brand,
          .footer-side {
            grid-column: 1 / -1;
          }

          .footer-map-content {
            grid-template-columns: 1fr;
          }

          .footer-map-box {
            min-height: 300px;
            border-right: none;
            border-bottom: 1px solid var(--ft-card-border);
          }

          .footer-map-frame {
            min-height: 300px;
          }
        }

        @media (max-width: 680px) {
          .footer-root {
            padding-left: 16px;
            padding-right: 16px;
          }

          .footer-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .footer-map-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-map-cta,
          .footer-location-btn {
            width: 100%;
          }

          .footer-bottom-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .footer-map-box {
            min-height: 240px;
          }

          .footer-map-frame {
            min-height: 240px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-root *,
          .footer-root *::before,
          .footer-root *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <footer
        id="public-footer"
        ref={rootRef}
        className="footer-root"
        data-theme={dark ? 'dark' : 'light'}
        style={rootStyle}
      >
        <div className="footer-shell">
          <div className="footer-topline" />

          <div className="footer-grid">
            <div className="footer-brand" style={fadeStyle(0.04)}>
              <Link href="/" className="footer-brand-link">
                <span className="footer-logo-box">
                  <img src={MD2I_MARKER_LOGO} alt="MD2I" />
                </span>

                <span>
                  <span className="footer-brand-title">MD2I</span>
                  <span className="footer-brand-subtitle">
                    {tr('footer.brand.tagline', 'Cabinet IT & solutions digitales')}
                  </span>
                </span>
              </Link>

              <div className="footer-badge">
                <span className="footer-badge-dot" />
                {tr('footer.brand.availability', 'Disponible pour nouveaux projets')}
              </div>

              <p className="footer-brand-copy">
                {tr(
                  'footer.brand.description',
                  'Nous accompagnons les entreprises dans leur transformation digitale : conseil, développement sur mesure, logiciels métiers, maintenance et solutions IT.'
                )}
              </p>

              <div className="footer-socials">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                    aria-label={social.label}
                    className="footer-social"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              <div className="footer-card footer-newsletter">
                <p className="footer-newsletter-title">
                  {tr('footer.newsletter.title', 'Recevoir les actualités MD2I')}
                </p>

                <p className="footer-newsletter-text">
                  {tr(
                    'footer.newsletter.text',
                    'Votre email sera ajouté au CRM comme contact marketing. Nous vous enverrons uniquement des informations utiles.'
                  )}
                </p>

                {subscribeResult ? (
                  <div
                    className={`footer-success-card ${
                      subscribeResult.type === 'created' ? 'created' : 'updated'
                    }`}
                  >
                    <div className="footer-success-layout">
                      <span className="footer-success-icon">
                        {subscribeResult.type === 'created' ? '✓' : '↻'}
                      </span>

                      <div>
                        <p className="footer-success-title">{subscribeResult.title}</p>
                        <p className="footer-success-text">{subscribeResult.message}</p>

                        <div className="footer-success-meta">
                          <span>
                            {tr('footer.newsletter.crmContact', 'Contact CRM')}
                          </span>

                          <strong>{subscribeResult.email}</strong>

                          {subscribeResult.companyName && (
                            <strong>
                              {tr(
                                'footer.newsletter.companyDetected',
                                'Entreprise détectée : {{company}}',
                                { company: subscribeResult.companyName }
                              )}
                            </strong>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={newsletterWebsite}
                      onChange={(event) => setNewsletterWebsite(event.target.value)}
                      className="footer-field-hidden"
                    />

                    <input
                      className="footer-input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleSubscribe()
                        }
                      }}
                      placeholder={tr('footer.newsletter.placeholder', 'votre@email.com')}
                    />

                    <button
                      type="button"
                      className="footer-btn"
                      onClick={handleSubscribe}
                      disabled={subscribeLoading}
                    >
                      {subscribeLoading
                        ? tr('footer.newsletter.adding', 'Ajout en cours...')
                        : tr('footer.newsletter.addEmail', 'Ajouter mon email')}
                    </button>

                    {subscribeError && (
                      <div className="footer-notice-error">{subscribeError}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={fadeStyle(0.10)}>
              <p className="footer-col-title">
                {tr('footer.sections.navigation', 'Navigation')}
              </p>

              <div className="footer-list">
                {links.map((link) => {
                  const Icon = link.icon

                  return (
                    <Link key={link.href} href={link.href} className="footer-link">
                      <span
                        className="footer-link-icon"
                        style={{
                          background: `${link.color}18`,
                          border: `1px solid ${link.color}28`,
                          color: link.color,
                        }}
                      >
                        <Icon size={14} />
                      </span>

                      <span className="footer-link-label">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div style={fadeStyle(0.16)}>
              <p className="footer-col-title">
                {tr('footer.sections.quickLinks', 'Accès rapides')}
              </p>

              <div className="footer-list">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="footer-link">
                    <span
                      className="footer-link-icon"
                      style={{
                        background: 'var(--ft-orange-soft)',
                        border: '1px solid var(--ft-orange-border)',
                        color: 'var(--ft-orange)',
                      }}
                    >
                      {link.icon || <ExternalLink size={14} />}
                    </span>

                    <span className="footer-link-label">{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* <div className="footer-source-block">
                <p className="footer-col-title">
                  {tr('footer.sections.sources', 'Sources utiles')}
                </p>

                <div className="footer-list">
                  {sourceLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noreferrer' : undefined}
                      className="footer-link"
                    >
                      <span
                        className="footer-link-icon"
                        style={{
                          background: 'var(--ft-icon)',
                          border: '1px solid var(--ft-icon-border)',
                          color: 'var(--ft-soft)',
                        }}
                      >
                        {link.icon || <ExternalLink size={14} />}
                      </span>

                      <span className="footer-link-label">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div> */}
            </div>

            <div className="footer-side" style={fadeStyle(0.24)}>
              <div className="footer-map-card">
                <div className="footer-map-top">
                  <div>
                    <p className="footer-map-title">
                      {tr('footer.location.title', 'Localisation MD2I')}
                    </p>

                    <p className="footer-map-subtitle">{MD2I_LOCATION_LABEL}</p>
                  </div>

                  <a
                    href={GOOGLE_MAP_SEARCH_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="footer-map-cta"
                    aria-label={tr('footer.location.openMaps', 'Ouvrir dans Google Maps')}
                  >
                    <ExternalLink size={13} />
                    Google Maps
                  </a>
                </div>

                <div className="footer-map-content">
                  <div className="footer-map-box">
                    <iframe
                      title={tr(
                        'footer.location.mapTitle',
                        'Localisation MD2I Madagascar sur Google Maps'
                      )}
                      src={GOOGLE_MAP_EMBED_URL}
                      className="footer-map-frame"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />

                    <div className="footer-map-overlay" />

                    <div className="footer-map-chip">
                      <span className="footer-map-chip-logo">
                        <img src={MD2I_MARKER_LOGO} alt="" />
                      </span>
                      MD2I Madagascar
                    </div>

                    <a
                      href={GOOGLE_MAP_SEARCH_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="footer-map-marker"
                      aria-label={tr('footer.location.openMaps', 'Ouvrir dans Google Maps')}
                    >
                      <span className="footer-map-marker-pulse" />

                      <img
                        src={MD2I_MARKER_LOGO}
                        alt={tr('footer.location.logoAlt', 'MD2I Madagascar')}
                      />
                    </a>

                    <div className="footer-map-label">Tsiadana, Antananarivo</div>
                  </div>

                  <div className="footer-map-meta">
                    <div>
                      <p className="footer-contact-title">
                        {tr('footer.contact.title', 'Coordonnées')}
                      </p>

                      <p className="footer-contact-subtitle">
                        {tr(
                          'footer.contact.subtitle',
                          'Contactez MD2I Madagascar ou ouvrez directement l’itinéraire.'
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="footer-location-btn"
                    >
                      <Navigation size={13} color={ORANGE} />

                      {locationLoading
                        ? tr('footer.location.locating', 'Localisation...')
                        : tr(
                            'footer.location.useMyLocation',
                            'Me localiser et ouvrir l’itinéraire'
                          )}
                    </button>

                    {locationMessage && (
                      <p className="footer-location-message">{locationMessage}</p>
                    )}

                    <div className="footer-contact-list">
                      {[
                        {
                          color: '#10B981',
                          text: MD2I_ADDRESS,
                          href: GOOGLE_MAP_SEARCH_URL,
                          external: true,
                          icon: <MapPin size={12} />,
                        },
                        {
                          color: '#3B82F6',
                          text: MD2I_EMAIL,
                          href: `mailto:${MD2I_EMAIL}`,
                          external: false,
                          icon: <Mail size={12} />,
                        },
                        {
                          color: '#F59E0B',
                          text: MD2I_PHONE_DISPLAY,
                          href: `tel:${MD2I_PHONE_HREF}`,
                          external: false,
                          icon: <Phone size={12} />,
                        },
                      ].map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noreferrer' : undefined}
                          className="footer-contact-link"
                        >
                          <div className="footer-contact-item">
                            <span
                              className="footer-contact-icon"
                              style={{
                                background: `${item.color}18`,
                                border: `1px solid ${item.color}28`,
                                color: item.color,
                              }}
                            >
                              {item.icon}
                            </span>

                            <span className="footer-contact-text">{item.text}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom" style={fadeStyle(0.32)}>
            <div className="footer-bottom-row">
              <p className="footer-copy">
                © {new Date().getFullYear()}{' '}
                <span style={{ color: ORANGE, fontWeight: 800 }}>MD2I</span>{' '}
                {tr(
                  'footer.legal.rights',
                  '— Tous droits réservés. Conçu avec soin à Madagascar 🇲🇬'
                )}
              </p>

              <div className="footer-bottom-links">
                {bottomLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="footer-bottom-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <span className="footer-version">v3.7</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}