'use client'

import { useEffect, useRef, useState } from 'react'
import s from './OrganisationSection.module.css'

const units = [
  {
    title: 'Développement commercial & accompagnement client',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Relation client, accompagnement et coordination de projet',
    icon: 'megaphone',
    tag: 'Pôle commercial',
    num: '01',
    text: `Ce pôle assure la relation avec les partenaires, les bailleurs et les porteurs de projet. Il intervient dans l'identification des besoins, la présentation des solutions, la coordination des échanges et l'accompagnement des utilisateurs. Il contribue également à la continuité de service à travers la formation, l'assistance et le suivi opérationnel.`,
    points: ['Relation client', 'Développement commercial', 'Formation', 'Assistance'],
    stats: [
      { num: '24h', label: 'Temps de réponse' },
      { num: '98%', label: 'Satisfaction client' },
    ],
  },
  {
    title: 'Analyse, recherche & innovation',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Analyse métier, recherche et innovation',
    icon: 'analytics',
    tag: 'Pôle analyse',
    num: '02',
    text: `Ce pôle transforme les besoins métiers en solutions structurées, robustes et évolutives. Il mobilise l'analyse fonctionnelle, la modélisation des processus, la veille technologique et réglementaire, ainsi que la formalisation des cahiers des charges. Il joue un rôle central dans l'innovation et dans l'adaptation des solutions aux exigences des projets.`,
    points: ['Analyse fonctionnelle', 'Recherche & développement', 'Innovation', 'Cahier des charges'],
    stats: [
      { num: 'R&D', label: 'Amélioration continue' },
      { num: '+10 ans', label: 'Expertise métier' },
    ],
  },
  {
    title: 'Développement, tests & assurance qualité',
    image:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Développement logiciel, tests et qualité',
    icon: 'code',
    tag: 'Pôle technique',
    num: '03',
    text: `Véritable cœur technique de MD2I, ce pôle conçoit, développe, teste et fiabilise les solutions logicielles. Il garantit la performance fonctionnelle, la stabilité technique et la conformité des livrables aux exigences définies. Les équipes assurent également les contrôles de cohérence, les tests d'usage et la validation qualité avant mise en production.`,
    points: ['Développement logiciel', 'Tests fonctionnels', 'Assurance qualité', 'Validation'],
    stats: [
      { num: '0', label: 'Défaut en production' },
      { num: 'ISO', label: 'Normes respectées' },
    ],
  },
]

function UnitIcon({ type }: { type: string }) {
  if (type === 'megaphone') {
    return (
      <svg viewBox="0 0 24 24" className={s.heroIconSvg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 6h2l-1.5-6H15l6 3V6l-6 3H5a2 2 0 0 0-2 2z" />
      </svg>
    )
  }
  if (type === 'analytics') {
    return (
      <svg viewBox="0 0 24 24" className={s.heroIconSvg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
        <circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="11" cy="11" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14" cy="14" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="19" cy="8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={s.heroIconSvg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 18l6-6-6-6" />
      <path d="M8 6l-6 6 6 6" />
    </svg>
  )
}

export default function OrganisationSection() {
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const headRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [glassOn, setGlassOn] = useState(false)
  const [headVisible, setHeadVisible] = useState(false)

  useEffect(() => {
    // ── Header entrance reveal ──
    const headTimer = setTimeout(() => setHeadVisible(true), 80)

    // ── Card scroll reveal ──
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(s.visible)
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    )
    cardRefs.current.forEach((card) => { if (card) cardObserver.observe(card) })

    // ── Scroll state ──
    const updateStates = () => {
      let nextActive = 0
      cardRefs.current.forEach((card, index) => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.62) nextActive = index
      })
      setActiveIndex((prev) => (prev !== nextActive ? nextActive : prev))
      setGlassOn(window.scrollY > 24)
    }

    window.addEventListener('scroll', updateStates, { passive: true })
    window.addEventListener('resize', updateStates)
    updateStates()

    return () => {
      clearTimeout(headTimer)
      cardObserver.disconnect()
      window.removeEventListener('scroll', updateStates)
      window.removeEventListener('resize', updateStates)
    }
  }, [])

  return (
    <section className={s.section} id="organisation" aria-labelledby="organisation-title">
      <div className={s.sectionGrid} aria-hidden="true" />

      <div className={s.wrap}>
        {/* ── Sticky header ── */}
        <div className={s.headSticky}>
          <header
            ref={headRef}
            className={`${s.head} ${glassOn ? s.headGlass : ''} ${headVisible ? s.headVisible : ''}`}
          >
            <div>
              <span className={s.eyebrow}>
                <span className={s.eyebrowDot} />
                Organisation
              </span>
              <h2 className={s.title} id="organisation-title">
                Une organisation pensée pour des <em>solutions fiables</em>,<br />
                agiles et durables
              </h2>
            </div>

            <div className={s.headRight}>
              <p className={s.lead}>
                MD2I s'appuie sur une organisation claire et complémentaire, structurée autour de
                trois pôles d'expertise. Cette organisation nous permet de comprendre les besoins,
                de concevoir des solutions adaptées, puis d'en assurer le déploiement, la qualité
                et le suivi opérationnel.
              </p>
              <div className={s.pills}>
                <span className={s.pill}>3 pôles d'expertise</span>
                <span className={s.pill}>accompagnement de bout en bout</span>
                <span className={s.pill}>qualité, fiabilité, réactivité</span>
              </div>
            </div>
          </header>
        </div>

        {/* ── Timeline rows ── */}
        <div className={s.rows}>
          {units.map((unit, index) => {
            const isActive = index === activeIndex
            const isPassed = index < activeIndex

            return (
              <div key={unit.title} className={s.row}>
                {/* Rail */}
                <div className={s.railCell} aria-hidden="true">
                  {index !== 0 && (
                    <span className={`${s.lineTop} ${index <= activeIndex ? s.lineActive : ''}`} />
                  )}

                  <span className={`${s.railNode} ${isActive ? s.active : ''} ${isPassed ? s.passed : ''}`}>
                    {unit.num}
                    <span className={s.railConnector} />
                  </span>

                  {index !== units.length - 1 && (
                    <span className={`${s.lineBottom} ${index < activeIndex ? s.lineActive : ''}`} />
                  )}
                </div>

                {/* Card */}
                <article
                  className={`${s.card} ${index % 2 === 1 ? s.rev : ''}`}
                  ref={(el) => { cardRefs.current[index] = el }}
                  style={{ transitionDelay: `${index * 0.08}s` }}
                >
                  <div className={s.mediaWrap}>
                    <img
                      src={unit.image}
                      alt={unit.alt}
                      className={s.media}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={s.mediaOverlay} />

                    {/* Number badge on photo */}
                    <div className={s.badge}>{unit.num}</div>

                    <div className={s.heroIcon}>
                      <UnitIcon type={unit.icon} />
                    </div>

                    <div className={s.imgTag}>
                      <span className={s.imgTagDot} />
                      {unit.tag}
                    </div>
                  </div>

                  <div className={s.content}>
                    <div className={s.contentInner}>
                      <div className={s.kicker} />
                      <h3 className={s.blockTitle}>{unit.title}</h3>
                      <p className={s.text}>{unit.text}</p>

                      <div className={s.tags}>
                        {unit.points.map((point) => (
                          <span key={point} className={s.tag}>
                            <span className={s.tagDot} />
                            {point}
                          </span>
                        ))}
                      </div>

                      <div className={s.statStrip}>
                        {unit.stats.map((stat) => (
                          <div key={stat.label} className={s.stat}>
                            <span className={s.statNum}>{stat.num}</span>
                            <span className={s.statLabel}>{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}