'use client'
// app/(public)/services/page.tsx
// ServiceCard + ServicesPage dans le même fichier

import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────
type ServiceCardProps = {
  icon: React.ReactNode
  badge?: string
  badgeColor?: string
  image?: string
  title: string
  description: string
  tags?: string[]
  cta?: string
  href?: string
  onClick?: () => void
  index?: number
}

const ORANGE      = '#EF9F27'
const ORANGE_DARK = '#c97d15'

// ─── Données ──────────────────────────────────────────────────────────────────
const SERVICES: ServiceCardProps[] = [
  {
    icon: '⚡',
    badge: 'Nouveau',
    title: 'Développement applicatif',
    description: 'Architectures cloud, microservices et APIs REST. De la conception au déploiement, nous construisons des solutions robustes et scalables.',
    tags: ['Cloud', 'API REST', 'Microservices'],
    cta: 'Découvrir',
    href: '/services/developpement',
  },
  {
    icon: '🛡️',
    badge: 'Pro',
    badgeColor: '#3dd68c',
    title: 'Cybersécurité & Infrastructure',
    description: "Audit de sécurité, mise en conformité RGPD et infrastructure haute disponibilité. Votre SI entre de bonnes mains.",
    tags: ['RGPD', 'Audit', 'Haute dispo'],
    cta: 'Audit gratuit',
    href: '/services/cybersecurite',
  },
  {
    icon: '📊',
    title: 'Gestion financière SARA',
    description: "Logiciels de gestion financière pour organisations internationales. Partenaires du FED et de l'UE depuis plus de 35 ans.",
    tags: ['FED', 'UE', '54 pays'],
    cta: 'En savoir plus',
    href: '/services/sara',
  },
  {
    icon: '🎓',
    badge: '54 pays',
    badgeColor: '#4fa3e0',
    title: 'Formation & Conseil',
    description: 'Programmes de formation sur mesure, coaching agile et accompagnement transformation digitale.',
    tags: ['Agile', 'Formation', 'Conseil'],
    cta: 'Voir les formations',
    href: '/services/formation',
  },
]

// ─── ServiceCard (composant local) ───────────────────────────────────────────
function ServiceCard({
  icon,
  badge,
  badgeColor = ORANGE,
  image,
  title,
  description,
  tags = [],
  cta = 'En savoir plus',
  href = '#',
  onClick,
  index = 0,
}: ServiceCardProps) {
  const { dark } = useTheme()
  const [hovered, setHovered] = useState(false)

  const cardBg     = dark ? 'rgba(255,255,255,.028)' : 'rgba(255,255,255,.88)'
  const cardBorder = dark
    ? hovered ? 'rgba(239,159,39,.35)' : 'rgba(255,255,255,.09)'
    : hovered ? 'rgba(239,159,39,.40)' : 'rgba(0,0,0,.09)'
  const cardShadow = dark
    ? hovered ? '0 20px 48px rgba(0,0,0,.38), 0 0 0 1px rgba(239,159,39,.18)' : '0 8px 24px rgba(0,0,0,.22)'
    : hovered ? '0 20px 48px rgba(0,0,0,.12), 0 0 0 1px rgba(239,159,39,.18)' : '0 4px 16px rgba(0,0,0,.07)'
  const titleColor = dark ? '#ede9e0' : '#161412'
  const descColor  = dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.52)'
  const tagBg      = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'
  const tagColor   = dark ? 'rgba(255,255,255,.48)' : 'rgba(0,0,0,.48)'
  const tagBorder  = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'
  const iconBg     = dark ? 'rgba(239,159,39,.10)' : 'rgba(239,159,39,.09)'
  const iconBorder = dark ? 'rgba(239,159,39,.22)' : 'rgba(239,159,39,.20)'
  const divider    = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'
  const shimmer    = dark ? 'rgba(255,255,255,.04)' : 'rgba(239,159,39,.04)'

  const content = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        border: `1px solid ${cardBorder}`,
        background: cardBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: cardShadow,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .25s, box-shadow .28s, transform .22s cubic-bezier(.22,1,.36,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        animation: `cardIn .55s cubic-bezier(.22,1,.36,1) ${index * 0.08}s both`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Shimmer */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 60% 0%, ${shimmer} 0%, transparent 65%)`,
        opacity: hovered ? 1 : 0, transition: 'opacity .3s',
      }} />

      {/* Trait accent haut */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
        background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`,
        opacity: hovered ? 0.9 : 0.3, transition: 'opacity .3s',
        borderRadius: '0 0 2px 2px',
      }} />

      {/* Thumbnail */}
      {image && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
          <img src={image} alt={title} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: dark
              ? 'linear-gradient(to bottom, transparent 40%, rgba(6,6,9,.85))'
              : 'linear-gradient(to bottom, transparent 40%, rgba(242,239,233,.85))',
          }} />
        </div>
      )}

      {/* Contenu */}
      <div style={{ padding: image ? '1.2rem 1.4rem 1.4rem' : '1.5rem 1.4rem 1.4rem', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>

        {/* Icône + Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '10px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '13px', flexShrink: 0,
            background: iconBg, border: `1px solid ${iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            transition: 'transform .2s, box-shadow .2s',
            transform: hovered ? 'rotate(-4deg) scale(1.08)' : 'none',
            boxShadow: hovered ? `0 4px 16px rgba(239,159,39,.22)` : 'none',
          }}>
            {icon}
          </div>
          {badge && (
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '.8px',
              textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px',
              background: `${badgeColor}18`, border: `1px solid ${badgeColor}44`,
              color: badgeColor, flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {badge}
            </span>
          )}
        </div>

        {/* Titre */}
        <h3 style={{
          margin: '0 0 .55rem', fontSize: '17px', fontWeight: 700,
          fontFamily: "'Syne', sans-serif", color: titleColor,
          lineHeight: 1.2, letterSpacing: '-.02em',
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{ margin: '0 0 1rem', fontSize: '13.5px', color: descColor, lineHeight: 1.72, fontWeight: 300, flex: 1 }}>
          {description}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.1rem' }}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontSize: '11px', fontWeight: 500, padding: '3px 10px',
                borderRadius: '20px', background: tagBg,
                border: `1px solid ${tagBorder}`, color: tagColor,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: divider, marginBottom: '1rem' }} />

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, color: ORANGE,
            letterSpacing: hovered ? '.5px' : '.2px', transition: 'letter-spacing .2s',
          }}>
            {cta}
          </span>
          <div style={{
            width: '30px', height: '30px', borderRadius: '9px',
            background: hovered ? `linear-gradient(135deg,${ORANGE},${ORANGE_DARK})` : `${ORANGE}18`,
            border: `1px solid ${hovered ? 'transparent' : `${ORANGE}33`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .22s', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={hovered ? '#fff' : ORANGE} strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'stroke .22s, transform .22s', transform: hovered ? 'translateX(1px)' : 'none' }}
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )

  return onClick ? content : (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      {content}
    </Link>
  )
}

// ─── Page (export default obligatoire pour Next.js) ───────────────────────────
export default function ServicesPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;400;500;600&display=swap');
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(28px, 4vw, 48px)',
          marginBottom: '0.5rem',
          fontWeight: 800,
          letterSpacing: '-.03em',
          animation: 'titleIn .5s cubic-bezier(.22,1,.36,1) both',
        }}>
          Nos services
        </h1>
        <p style={{
          fontSize: '15px',
          marginBottom: '3rem',
          opacity: 0.5,
          fontWeight: 300,
          animation: 'titleIn .5s cubic-bezier(.22,1,.36,1) .1s both',
        }}>
          54 pays · 35 ans d'expérience · 3 langues
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.href} {...service} index={i} />
          ))}
        </div>
      </main>
    </>
  )
}