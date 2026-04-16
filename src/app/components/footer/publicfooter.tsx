'use client' // Indique à Next.js que ce composant doit être rendu côté client.

// Importe Link de Next.js pour la navigation interne.
import Link from 'next/link'

// Importe les hooks React nécessaires au composant.
import { useState, useMemo, useEffect, useRef } from 'react'

// Importe le contexte de thème déjà utilisé dans ton footer d’origine.


// Importe le nouveau composant TechListe qui gère toute la partie techno.
import TechListe from './TechListe'
import { useTheme } from '@/app/context/ThemeContext'

// Couleur orange principale de la marque.
const ORANGE = '#EF9F27'

// Définition des liens principaux de navigation.
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
]

// Définition des services rapides affichés dans le footer.
const SERVICES = [
  { href: '/services#web', label: 'Développement web', icon: '⚡' },
  { href: '/services#mobile', label: 'Applications mobiles', icon: '📱' },
  { href: '/services#conseil', label: 'Conseil IT', icon: '💡' },
  { href: '/services#infogerance', label: 'Infogérance', icon: '🛡️' },
  { href: '/services#cyber', label: 'Cybersécurité', icon: '🔒' },
  { href: '/services#formation', label: 'Formation digitale', icon: '🎓' },
]

// Liste des réseaux sociaux ou contacts rapides.
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
    href: 'mailto:contact@md2i.mg',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="2,4 12,13 22,4" /></svg>,
  },
]

// Fonction qui retourne tous les tokens de design selon le thème clair/sombre.
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
  }
}

// Hook pour faire apparaître doucement le footer au scroll.
function useFadeIn(delay = 0) {
  // Référence de l’élément observé.
  const ref = useRef<HTMLDivElement>(null)

  // État indiquant si l’élément est visible.
  const [visible, setVisible] = useState(false)

  // Effet qui branche l’IntersectionObserver.
  useEffect(() => {
    // Récupère l’élément réel.
    const el = ref.current

    // Si l’élément n’existe pas encore, on arrête.
    if (!el) return

    // Crée l’observer.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Si l’élément entre dans l’écran.
        if (entry.isIntersecting) {
          // On le rend visible.
          setVisible(true)

          // Puis on arrête l’observation.
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    // On commence l’observation.
    observer.observe(el)

    // Nettoyage au démontage.
    return () => observer.disconnect()
  }, [delay])

  // Retourne la ref et l’état.
  return { ref, visible }
}

// Petit séparateur décoratif entre la page et le footer.
function FooterSeparator({ dark }: { dark: boolean }) {
  return (
    <div style={{ position: 'relative', height: 80, overflow: 'hidden', marginBottom: -2 }}>
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

// Composant principal du footer public.
export default function PublicFooter() {
  // Récupère le thème courant depuis ton contexte.
  const { dark } = useTheme()

  // Calcule les tokens uniquement quand le thème change.
  const t = useMemo(() => tokens(dark), [dark])

  // État pour le champ newsletter.
  const [email, setEmail] = useState('')

  // État pour savoir si l’inscription a réussi.
  const [subscribed, setSubscribed] = useState(false)

  // Active l’animation d’apparition générale du footer.
  const { ref: rootRef, visible } = useFadeIn()

  // Fonction appelée quand on clique sur s’abonner.
  const handleSubscribe = () => {
    // Vérification simple de l’email.
    if (!email.includes('@')) return

    // Affiche le message de succès.
    setSubscribed(true)

    // Vide le champ.
    setEmail('')

    // Cache le message après 4 secondes.
    setTimeout(() => setSubscribed(false), 4000)
  }

  // Fonction utilitaire pour générer les styles d’apparition progressive.
  const fadeStyle = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(22px)',
    transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
  })

  return (
    <>
      {/* Bloc de styles internes du footer. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        .fnl-input:focus { outline: none; border-color: rgba(239,159,39,.45) !important; }
        .fnl-input::placeholder { color: ${t.subtleText}; }

        .fnl-btn:hover { opacity: .86; transform: translateY(-1px); }
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

        @media (max-width: 1040px) {
          .fgrid-bottom { grid-template-columns: 1fr 1fr !important; }
          .fbrand { grid-column: 1 / -1 !important; }
        }

        @media (max-width: 680px) {
          .fgrid-bottom { grid-template-columns: 1fr !important; }
          .fbrand { grid-column: auto !important; }
          .fbottom { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* Affiche le séparateur au-dessus du footer. */}
      <FooterSeparator dark={dark} />

      {/* Footer principal. */}
      <footer
        ref={rootRef}
        style={{
          background: t.bg,
          borderTop: `1px solid ${t.border}`,
          padding: 'clamp(36px, 5vw, 56px) clamp(16px, 5vw, 72px) 28px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Conteneur central du footer. */}
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          {/* Partie haute : composant TechListe. */}
          <div style={{ ...fadeStyle(0), marginBottom: 36 }}>
            <TechListe dark={dark} theme={t} />
          </div>

          {/* Ligne de séparation entre stack et contenu bas du footer. */}
          <div style={{ height: 1, background: t.border, marginBottom: 40 }} />

          {/* Partie basse du footer : marque, navigation, services, contact/newsletter. */}
          <div
            className="fgrid-bottom"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1fr 1fr 1.35fr',
              gap: '40px 32px',
              marginBottom: 48,
            }}
          >
            {/* Bloc marque / identité. */}
            <div className="fbrand" style={fadeStyle(0.06)}>
              <Link
                href="/"
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
                    width: 44,
                    height: 44,
                    borderRadius: 13,
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
                      fontSize: 15,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    MD
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      color: t.text,
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    MD2I
                  </div>

                  <div
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
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.78,
                  color: t.softText,
                  marginBottom: 22,
                  maxWidth: 340,
                }}
              >
                Nous accompagnons les entreprises dans leur transformation digitale — conseil, développement sur mesure et solutions IT innovantes à Madagascar et à l'international.
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="fsoc"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
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
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Bloc navigation. */}
            <div style={fadeStyle(0.12)}>
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

            {/* Bloc services. */}
            <div style={fadeStyle(0.18)}>
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
                {SERVICES.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
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
                      {s.icon}
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
                      {s.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Colonne droite : carte localisation + newsletter. */}
            <div style={{ ...fadeStyle(0.26), display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Carte localisation / contact. */}
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
                {/* En-tête de la carte. */}
                <div
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
                      Notre localisation
                    </p>

                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: t.softText,
                        lineHeight: 1.5,
                      }}
                    >
                      Antananarivo, Madagascar
                    </p>
                  </div>

                  <a
                    href="https://www.openstreetmap.org/?mlat=-18.91&mlon=47.51#map=14/-18.91/47.51"
                    target="_blank"
                    rel="noreferrer"
                    className="footer-map-cta"
                    aria-label="Ouvrir la carte dans OpenStreetMap"
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
                    Ouvrir
                  </a>
                </div>

                {/* Zone carte OpenStreetMap. */}
                <div
                  style={{
                    position: 'relative',
                    height: 'clamp(220px, 28vw, 320px)',
                    overflow: 'hidden',
                    background: dark ? '#101216' : '#EEF2F7',
                  }}
                >
                  <iframe
                    title="Localisation MD2I Antananarivo"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=47.4700,-18.9500,47.5500,-18.8700&layer=mapnik&marker=-18.9100,47.5100"
                    className="footer-map-frame"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      opacity: 0.92,
                      pointerEvents: 'auto',
                    }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: dark
                        ? 'linear-gradient(180deg, rgba(12,12,16,.10) 0%, rgba(12,12,16,.02) 28%, rgba(12,12,16,.18) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.02) 28%, rgba(247,247,249,.24) 100%)',
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
                      background: dark ? 'rgba(12,12,16,.72)' : 'rgba(255,255,255,.82)',
                      border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239,159,39,.16)',
                        color: ORANGE,
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    Antananarivo
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -70%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: 26,
                        height: 26,
                        borderRadius: '50% 50% 50% 0',
                        background: ORANGE,
                        transform: 'rotate(-45deg)',
                        boxShadow: `0 10px 25px ${ORANGE}66`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#fff',
                          transform: 'rotate(45deg)',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        width: 28,
                        height: 10,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,.18)',
                        filter: 'blur(4px)',
                      }}
                    />
                  </div>
                </div>

                {/* Coordonnées rapides sous la carte. */}
                <div
                  style={{
                    padding: '14px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {[
                    {
                      color: '#10B981',
                      text: 'Antananarivo, Madagascar',
                      href: 'https://www.openstreetmap.org/?mlat=-18.91&mlon=47.51#map=14/-18.91/47.51',
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
                      text: 'contact@md2i.mg',
                      href: 'mailto:contact@md2i.mg',
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
                      text: '+261 20 00 000 00',
                      href: 'tel:+261200000000',
                      external: false,
                      icon: (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      ),
                    },
                  ].map((item, i) => {
                    // Contenu commun de chaque ligne de contact.
                    const content = (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 10px',
                          borderRadius: 12,
                          border: `1px solid ${dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'}`,
                          background: dark ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.72)',
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
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
                          }}
                        >
                          {item.text}
                        </span>
                      </div>
                    )

                    // Si le lien est externe, on ajoute target et rel.
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

              {/* Carte newsletter. */}
              <div
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
                  Newsletter
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: t.softText,
                    lineHeight: 1.55,
                    marginBottom: 12,
                  }}
                >
                  Actualités IT et offres exclusives.
                </p>

                {subscribed ? (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(34,197,94,.10)',
                      border: '1px solid rgba(34,197,94,.28)',
                      color: '#22C55E',
                      fontSize: 12.5,
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    ✓ Merci pour votre inscription !
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <input
                      className="fnl-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                      placeholder="votre@email.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
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
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: ORANGE,
                        border: 'none',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all .18s ease',
                      }}
                    >
                      S'abonner →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bas de footer. */}
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

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
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
                v3.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}