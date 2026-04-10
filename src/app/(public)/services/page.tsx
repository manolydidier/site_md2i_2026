'use client';
import { useState, useEffect, useRef } from "react";

/* ─── PALETTE ───────────────────────────────────────────── */
const C = {
  navy:      "#0A2046",
  navyMid:   "#0E4D6C",
  teal:      "#0A7A76",
  tealAcc:   "#7ECCC8",
  bg:        "#F7F9FC",
  bgSoft:    "#F0FAFA",
  bgCard:    "#FFFFFF",
  border:    "#E2E8F0",
  borderHov: "#B2C8D8",
  textMain:  "#0F172A",
  textSub:   "#475569",
};

/* ─── SVG ICONS ─────────────────────────────────────────── */
const Icons = {
  Settings: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Landmark: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22"/>
      <line x1="6" y1="18" x2="6" y2="11"/>
      <line x1="10" y1="18" x2="10" y2="11"/>
      <line x1="14" y1="18" x2="14" y2="11"/>
      <line x1="18" y1="18" x2="18" y2="11"/>
      <polygon points="12 2 20 7 4 7"/>
    </svg>
  ),
  Layers: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Code: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Droplets: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
    </svg>
  ),
  BookOpen: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  LineChart: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Brain: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/>
    </svg>
  ),
  GraduationCap: ({ color, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  ArrowRight: ({ color, size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  ChevronRight: ({ color, size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

/* ─── SERVICE DATA ──────────────────────────────────────── */
const services = [
  {
    Icon: Icons.Settings,
    title: "Assistance technique à la gestion de projet",
    description:
      "Maîtrise d'ouvrage et accompagnement opérationnel pour garantir la qualité d'exécution, la redevabilité et la durabilité des programmes complexes.",
    accent: C.teal,
    accentLight: "#E0F2F1",
  },
  {
    Icon: Icons.Landmark,
    title: "Appui institutionnel",
    description:
      "Renforcement de la gouvernance, des procédures et de l'efficacité opérationnelle au sein des institutions publiques et organisations partenaires.",
    accent: C.navy,
    accentLight: "#EEF2FA",
  },
  {
    Icon: Icons.Layers,
    title: "Digitalisation et dématérialisation",
    description:
      "Conception et déploiement de solutions de digitalisation à grande échelle avec des systèmes sécurisés de gestion de données.",
    accent: C.teal,
    accentLight: "#E0F2F1",
  },
  {
    Icon: Icons.Code,
    title: "Développement logiciel et modélisation",
    description:
      "Solutions logicielles sur mesure pour les finances publiques, le foncier, la justice, l'éducation et les programmes de développement.",
    accent: C.navy,
    accentLight: "#EEF2FA",
  },
  {
    Icon: Icons.Droplets,
    title: "Génie hydraulique et génie civil",
    description:
      "Association de l'ingénierie informatique aux problématiques d'infrastructure et hydrauliques pour la prévention des risques.",
    accent: C.teal,
    accentLight: "#E0F2F1",
  },
  {
    Icon: Icons.BookOpen,
    title: "Logiciels de gestion comptable et RH",
    description:
      "Systèmes intégrés de gestion financière, comptable et des ressources humaines conformes aux standards internationaux.",
    accent: C.navy,
    accentLight: "#EEF2FA",
  },
  {
    Icon: Icons.LineChart,
    title: "Études socio-économiques et enquêtes",
    description:
      "Enquêtes, diagnostics et études socio-économiques à l'échelle nationale et régionale pour appuyer la prise de décision stratégique.",
    accent: C.teal,
    accentLight: "#E0F2F1",
  },
  {
    Icon: Icons.Brain,
    title: "Intelligence artificielle",
    description:
      "Intégration d'outils avancés de traitement de données, d'automatisation et d'aide à la décision dans les systèmes d'information publics.",
    accent: C.navy,
    accentLight: "#EEF2FA",
  },
  {
    Icon: Icons.GraduationCap,
    title: "Formation et renforcement de capacités",
    description:
      "Formations professionnelles et dispositifs de renforcement de capacités sur le long terme, fondés sur une approche andragogique rigoureuse.",
    accent: C.teal,
    accentLight: "#E0F2F1",
  },
];

/* ─── INTERSECTION OBSERVER HOOK ───────────────────────── */
function useVisible(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── SERVICE CARD ──────────────────────────────────────── */
function ServiceCard({ service, delay }) {
  const [hovered, setHovered] = useState(false);
  const [ref, visible] = useVisible(0.08);
  const { Icon } = service;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.bgCard,
        border: `1px solid ${hovered ? C.borderHov : C.border}`,
        borderRadius: "16px",
        padding: "28px 26px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition:
          "transform 0.38s cubic-bezier(.22,1,.36,1), box-shadow 0.38s ease, border-color 0.25s ease, opacity 0.55s ease",
        transform: visible
          ? hovered ? "translateY(-5px)" : "translateY(0)"
          : "translateY(20px)",
        boxShadow: hovered
          ? `0 18px 44px rgba(10,32,70,0.11), 0 2px 8px rgba(10,32,70,0.05)`
          : `0 1px 4px rgba(10,32,70,0.04)`,
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: `linear-gradient(90deg, ${service.accent} 0%, transparent 100%)`,
        borderRadius: "16px 16px 0 0",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.3s ease",
      }} />

      {/* Icon bubble */}
      <div style={{
        width: "46px",
        height: "46px",
        borderRadius: "12px",
        background: hovered ? service.accent : service.accentLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.3s ease",
      }}>
        <Icon
          color={hovered ? "#FFFFFF" : service.accent}
          size={20}
        />
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0,
        fontSize: "0.9375rem",
        fontWeight: 650,
        color: C.textMain,
        lineHeight: 1.35,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        letterSpacing: "-0.01em",
      }}>
        {service.title}
      </h3>

      {/* Description */}
      <p style={{
        margin: 0,
        fontSize: "0.8125rem",
        color: C.textSub,
        lineHeight: 1.72,
        fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
        flex: 1,
      }}>
        {service.description}
      </p>

      {/* Hover footer link */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateX(0)" : "translateX(-8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        marginTop: "2px",
      }}>
        <span style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: service.accent,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
        }}>
          En savoir plus
        </span>
        <Icons.ChevronRight color={service.accent} size={13} />
      </div>
    </div>
  );
}

/* ─── CTA BUTTON ────────────────────────────────────────── */
function CTAButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#contact"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        padding: "14px 28px",
        borderRadius: "12px",
        background: hovered ? C.tealAcc : "rgba(126,204,200,0.13)",
        border: `1.5px solid ${hovered ? C.tealAcc : "rgba(126,204,200,0.4)"}`,
        color: hovered ? C.navy : C.tealAcc,
        fontWeight: 700,
        fontSize: "0.875rem",
        letterSpacing: "0.02em",
        textDecoration: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "all 0.28s cubic-bezier(.22,1,.36,1)",
        fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
      }}
    >
      Nous contacter
      <span style={{
        display: "inline-flex",
        transition: "transform 0.28s ease",
        transform: hovered ? "translateX(3px)" : "translateX(0)",
      }}>
        <Icons.ArrowRight color={hovered ? C.navy : C.tealAcc} size={15} />
      </span>
    </a>
  );
}

/* ─── MAIN EXPORT ───────────────────────────────────────── */
export default function MD2IServicesSection() {
  const [headerRef, headerVisible] = useVisible(0.2);
  const [ctaRef, ctaVisible] = useVisible(0.15);

  return (
    <section style={{ background: C.bg, position: "relative", overflow: "hidden", padding: "96px 24px" }}>

      {/* Background halos */}
      <div style={{
        position: "absolute", top: "-140px", right: "-100px",
        width: "520px", height: "520px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(126,204,200,0.09) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", left: "-80px",
        width: "420px", height: "420px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(10,32,70,0.055) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1152px", margin: "0 auto", position: "relative" }}>

        {/* ── HEADER ── */}
        <div
          ref={headerRef}
          style={{
            textAlign: "center",
            marginBottom: "72px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(26px)",
            transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "999px",
            background: C.bgSoft,
            border: `1px solid rgba(126,204,200,0.35)`,
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.teal }} />
            <span style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: C.teal,
              fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
            }}>
              MD2I Madagascar
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            margin: 0,
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 700,
            color: C.navy,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
          }}>
            Nos domaines d'expertise
          </h2>

          {/* Decorative rule */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "1px", background: `linear-gradient(to right, transparent, ${C.tealAcc})` }} />
            <div style={{ width: "28px", height: "2px", borderRadius: "999px", background: `linear-gradient(90deg, ${C.teal}, ${C.tealAcc})` }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.tealAcc, border: `1.5px solid ${C.teal}` }} />
            <div style={{ width: "28px", height: "2px", borderRadius: "999px", background: `linear-gradient(90deg, ${C.tealAcc}, ${C.teal})` }} />
            <div style={{ width: "32px", height: "1px", background: `linear-gradient(to left, transparent, ${C.tealAcc})` }} />
          </div>

          {/* Intro */}
          <p style={{
            maxWidth: "620px",
            margin: 0,
            fontSize: "1rem",
            color: C.textSub,
            lineHeight: 1.8,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontStyle: "italic",
          }}>
            Depuis plus de 21 ans, MD2I Madagascar accompagne les institutions
            publiques, les projets de développement et les organisations
            internationales en qualité de partenaire en conseil, ingénierie,
            digitalisation et appui institutionnel.
          </p>
        </div>

        {/* ── GRID ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "64px",
        }}
          className="md2i-grid"
        >
          {services.map((s, i) => (
            <ServiceCard key={i} service={s} delay={i * 55} />
          ))}
        </div>

        {/* ── CTA BLOCK ── */}
        <div
          ref={ctaRef}
          style={{
            borderRadius: "20px",
            background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 55%, #0D6080 100%)`,
            padding: "52px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "40px",
            position: "relative",
            overflow: "hidden",
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(.22,1,.36,1) 0.15s",
          }}
        >
          {/* CTA decorative halos */}
          <div style={{
            position: "absolute", right: "-50px", top: "-50px",
            width: "260px", height: "260px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(126,204,200,0.13) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", left: "40%", bottom: "-70px",
            width: "200px", height: "200px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ width: "28px", height: "2px", borderRadius: "999px", background: C.tealAcc, marginBottom: "16px" }} />
            <h3 style={{
              margin: "0 0 14px",
              fontSize: "clamp(1.2rem, 2.2vw, 1.5rem)",
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}>
              Une expertise au service des institutions et des projets
            </h3>
            <p style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.62)",
              lineHeight: 1.78,
              maxWidth: "520px",
              fontFamily: "'Lato', 'Helvetica Neue', sans-serif",
            }}>
              MD2I intervient avec des solutions sécurisées, évolutives et
              rigoureusement adaptées aux réalités de terrain, en partenariat
              étroit avec les acteurs publics, les projets et les partenaires
              techniques et financiers.
            </p>
          </div>

          <CTAButton />
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .md2i-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .md2i-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}