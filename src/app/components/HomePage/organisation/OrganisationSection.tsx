'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import s from './OrganisationSection.module.css'
import { useTheme } from '@/app/context/ThemeContext'

type UnitStat = {
  num: string
  label: string
}

type Unit = {
  title: string
  image: string
  fallbackImage: string
  alt: string
  icon: 'megaphone' | 'analytics' | 'code'
  tag: string
  num: string
  text: string
  longText: string
  points: string[]
  stats: UnitStat[]
  details: string[]
  process: string[]
  tools: string[]
  benefits: string[]
  illustrationCaption: string
}

const units: Unit[] = [
  {
    title: 'Développement commercial & accompagnement client',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
    fallbackImage:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
    alt: 'Relation client, coordination projet et accompagnement des partenaires',
    icon: 'megaphone',
    tag: 'Pôle commercial',
    num: '01',
    text:
      "Ce pôle pilote la relation avec les partenaires, comprend les besoins, cadre les échanges et accompagne les utilisateurs jusqu'à la mise en service.",
    longText:
      "Ce pôle constitue la porte d’entrée de la relation client. Il identifie les besoins, reformule les attentes, structure les échanges et accompagne les partenaires tout au long du cycle de vie du projet. Il joue aussi un rôle décisif dans la formation, l’assistance, la conduite du changement et le suivi post-déploiement afin de garantir une adoption fluide et durable des solutions.",
    points: ['Relation client', 'Développement commercial', 'Formation', 'Assistance'],
    stats: [
      { num: '24h', label: 'Temps de réponse' },
      { num: '98%', label: 'Satisfaction' },
    ],
    details: [
      'Qualification des demandes et compréhension des enjeux métiers',
      'Coordination des échanges entre partenaires, équipes et bénéficiaires',
      'Préparation des propositions, démonstrations et cadrages initiaux',
      'Formation des utilisateurs et accompagnement au démarrage',
      'Suivi opérationnel pour maintenir la qualité de service',
    ],
    process: [
      'Recueillir le besoin et clarifier les objectifs',
      'Traduire les attentes en cadrage exploitable',
      'Coordonner la réponse avec les pôles analyse et technique',
      'Accompagner le déploiement et la prise en main',
      'Suivre l’usage, les retours et les ajustements',
    ],
    tools: ['CRM', 'Ateliers client', 'Support', 'Formation', 'Reporting'],
    benefits: [
      'Vision claire du besoin',
      'Communication plus fluide',
      'Adoption plus rapide des solutions',
    ],
    illustrationCaption:
      'Le pôle commercial crée le lien entre besoin exprimé, solution conçue et expérience vécue.',
  },
  {
    title: 'Analyse, recherche & innovation',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    fallbackImage:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
    alt: 'Analyse métier, innovation, recherche et structuration fonctionnelle',
    icon: 'analytics',
    tag: 'Pôle analyse',
    num: '02',
    text:
      'Ce pôle transforme les besoins métiers en solutions structurées, robustes et évolutives grâce à l’analyse, la modélisation et la veille.',
    longText:
      "Le pôle analyse traduit les attentes des utilisateurs en exigences concrètes, cohérentes et priorisées. Il mobilise l’analyse fonctionnelle, la modélisation des processus, la documentation, la veille technologique ainsi que la recherche de solutions innovantes. Son rôle est de sécuriser la pertinence des choix avant le développement, afin d’éviter les dérives et d’assurer l’alignement entre besoin, usage et solution.",
    points: ['Analyse fonctionnelle', 'R&D', 'Innovation', 'Cahier des charges'],
    stats: [
      { num: 'R&D', label: 'Amélioration continue' },
      { num: '+10 ans', label: 'Expertise métier' },
    ],
    details: [
      'Analyse des processus et des usages existants',
      'Formalisation des spécifications fonctionnelles',
      'Veille sur les méthodes, outils et contraintes réglementaires',
      'Recherche de solutions adaptées au contexte du projet',
      'Priorisation des besoins pour sécuriser le développement',
    ],
    process: [
      'Observer les flux et les besoins du terrain',
      'Modéliser les parcours, contraintes et cas d’usage',
      'Formaliser les règles métier et les exigences',
      'Valider les arbitrages fonctionnels avec les parties prenantes',
      'Préparer une base fiable pour le développement',
    ],
    tools: ['Audit', 'Benchmark', 'Diagrammes', 'Spécifications', 'Veille'],
    benefits: [
      'Moins d’ambiguïtés en projet',
      'Décisions mieux justifiées',
      'Solutions plus adaptées et évolutives',
    ],
    illustrationCaption:
      "Le pôle analyse sécurise l’intelligence du projet avant sa construction technique.",
  },
  {
    title: 'Développement, tests & assurance qualité',
    image:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    fallbackImage:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80',
    alt: 'Développement logiciel, tests, validation et assurance qualité',
    icon: 'code',
    tag: 'Pôle technique',
    num: '03',
    text:
      'Ce pôle conçoit, développe, teste et fiabilise les solutions logicielles pour assurer performance, stabilité et conformité des livrables.',
    longText:
      "Le pôle technique matérialise la solution. Il développe les fonctionnalités, vérifie leur robustesse, réalise les tests nécessaires et contrôle la qualité avant toute mise en production. Il garantit la performance fonctionnelle, la stabilité technique, la sécurité d’exécution et la conformité des livrables avec les exigences définies en amont.",
    points: ['Développement', 'Tests fonctionnels', 'Qualité', 'Validation'],
    stats: [
      { num: '0', label: 'Défaut critique' },
      { num: 'ISO', label: 'Bonnes pratiques' },
    ],
    details: [
      'Conception et développement des fonctionnalités',
      'Tests de cohérence, de parcours et de validation',
      'Contrôle qualité avant mise en production',
      'Correction, optimisation et sécurisation des livrables',
      'Support technique et évolutions après livraison',
    ],
    process: [
      'Construire la solution à partir des spécifications validées',
      'Tester les scénarios d’usage et les règles métier',
      'Corriger les écarts détectés',
      'Valider la qualité et préparer la mise en production',
      'Maintenir et améliorer la solution dans le temps',
    ],
    tools: ['Code review', 'Tests', 'QA', 'Recette', 'Monitoring'],
    benefits: [
      'Livrables plus fiables',
      'Risque réduit en production',
      'Maintenance facilitée',
    ],
    illustrationCaption:
      'Le pôle technique transforme la vision métier en solution stable, testée et prête à servir.',
  },
]

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [locked])
}

function useDialogFocusTrap(
  open: boolean,
  ref: { current: HTMLDivElement | null },
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return

    const container = ref.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const getFocusableElements = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('aria-hidden'))

    const focusable = getFocusableElements()
    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const currentFocusable = getFocusableElements()
      if (!currentFocusable.length) {
        event.preventDefault()
        return
      }

      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, ref])
}

function UnitIcon({ type }: { type: Unit['icon'] }) {
  if (type === 'megaphone') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={s.heroIconSvg}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 11v2a2 2 0 0 0 2 2h1l3 6h2l-1.5-6H15l6 3V6l-6 3H5a2 2 0 0 0-2 2z" />
      </svg>
    )
  }

  if (type === 'analytics') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={s.heroIconSvg}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
    <svg
      viewBox="0 0 24 24"
      className={s.heroIconSvg}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 18l6-6-6-6" />
      <path d="M8 6l-6 6 6 6" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.btnIcon} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.btnIcon} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.btnIcon} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.btnIcon} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export default function OrganisationSection() {
  const { dark } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  const [activeIndex, setActiveIndex] = useState(0)
  const [glassOn, setGlassOn] = useState(false)
  const [headVisible, setHeadVisible] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  const modalTitleId = useId()
  const modalDescId = useId()

  const selectedUnit = selectedIndex !== null ? units[selectedIndex] : null
  const themeMode = dark ? 'dark' : 'light'
  const progress = `${((activeIndex + 1) / units.length) * 100}%`

  useLockBodyScroll(selectedIndex !== null)
  useDialogFocusTrap(selectedIndex !== null, modalRef, () => setSelectedIndex(null))

  useEffect(() => {
    const headTimer = window.setTimeout(() => setHeadVisible(true), 80)

    const updateScrollState = () => {
      let nextActive = 0

      cardRefs.current.forEach((card, index) => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.62) nextActive = index
      })

      setActiveIndex((prev) => (prev !== nextActive ? nextActive : prev))
      setGlassOn(window.scrollY > 24)
    }

    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    updateScrollState()

    return () => {
      clearTimeout(headTimer)
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [])

  const openModal = (index: number) => setSelectedIndex(index)
  const closeModal = () => setSelectedIndex(null)

  const scrollToCard = (index: number) => {
    const target = cardRefs.current[index]
    if (!target) return

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    })

    setActiveIndex(index)
  }

  const showPrevious = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? units.length - 1 : selectedIndex - 1)
  }

  const showNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === units.length - 1 ? 0 : selectedIndex + 1)
  }

  const currentHeadline = useMemo(
    () => `${activeIndex + 1}/${units.length} • ${units[activeIndex].tag}`,
    [activeIndex]
  )

  return (
    <section
      className={s.section}
      data-theme={themeMode}
      id="organisation"
      aria-labelledby="organisation-title"
    >
      <div className={s.sectionGrid} aria-hidden="true" />

      <div className={s.wrap}>
        <div className={s.headSticky}>
          <header
            className={`${s.head} ${glassOn ? s.headGlass : ''} ${headVisible ? s.headVisible : ''}`}
          >
            <div>
              <span className={s.eyebrow}>
                <span className={s.eyebrowDot} />
                Organisation
              </span>

              <h2 className={s.title} id="organisation-title">
                Une organisation pensée pour des <em>solutions fiables</em>, agiles et durables
              </h2>
            </div>

            <div className={s.headRight}>
              <p className={s.lead}>
                MD2I s&apos;appuie sur une organisation claire et complémentaire, structurée autour
                de trois pôles d&apos;expertise. Chaque pôle joue un rôle précis dans la chaîne de
                valeur, du besoin initial jusqu&apos;au déploiement, au suivi et à l&apos;amélioration.
              </p>

              <div className={s.pills}>
                <span className={s.pill}>3 pôles d&apos;expertise</span>
               
              </div>

              <div className={s.headMeta}>
                <div className={s.progressTop}>
                  <span className={s.progressLabel}>Parcours actif</span>
                  <span className={s.progressValue}>{currentHeadline}</span>
                </div>

                <div className={s.progressTrack} aria-hidden="true">
                  <span className={s.progressBar} style={{ width: progress }} />
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className={s.rows}>
          {units.map((unit, index) => {
            const isActive = index === activeIndex
            const isPassed = index < activeIndex

            return (
              <div key={unit.title} className={s.row}>
                <div className={s.railCell}>
                  {index !== 0 && (
                    <span className={`${s.lineTop} ${index <= activeIndex ? s.lineActive : ''}`} />
                  )}

                  <button
                    type="button"
                    className={`${s.railNode} ${isActive ? s.active : ''} ${isPassed ? s.passed : ''}`}
                    onClick={() => scrollToCard(index)}
                    aria-label={`Aller à ${unit.title}`}
                  >
                    {unit.num}
                    <span className={s.railConnector} />
                  </button>

                  {index !== units.length - 1 && (
                    <span className={`${s.lineBottom} ${index < activeIndex ? s.lineActive : ''}`} />
                  )}
                </div>

                <motion.article
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  className={`${s.card} ${index % 2 === 1 ? s.rev : ''} ${isActive ? s.cardActive : ''}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 34, scale: 0.988 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.65,
                    delay: index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.div
                    className={s.mediaWrap}
                    whileHover={prefersReducedMotion ? {} : { y: -2 }}
                    transition={{ duration: 0.35 }}
                  >
                    <img
                      src={imageErrors[index] ? unit.fallbackImage : unit.image}
                      alt={unit.alt}
                      className={s.media}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [index]: true,
                        }))
                      }
                    />

                    <div className={s.mediaOverlay} />
                    <div className={s.badge}>{unit.num}</div>

                    <div className={s.heroIcon}>
                      <UnitIcon type={unit.icon} />
                    </div>

                    <div className={s.imgTag}>
                      <span className={s.imgTagDot} />
                      {unit.tag}
                    </div>
                  </motion.div>

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

                      <div className={s.processPreview}>
                        {unit.process.slice(0, 3).map((step, stepIndex) => (
                          <div key={step} className={s.processPreviewItem}>
                            <span className={s.processPreviewIndex}>0{stepIndex + 1}</span>
                            <span className={s.processPreviewText}>{step}</span>
                          </div>
                        ))}
                      </div>

                      <div className={s.cardActions}>
                        <button
                          type="button"
                          className={s.actionPrimary}
                          onClick={() => openModal(index)}
                        >
                          Voir le détail
                          <ArrowIcon />
                        </button>

                        <button
                          type="button"
                          className={s.actionGhost}
                          onClick={() => scrollToCard(index)}
                        >
                          Explorer ce pôle
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </div>
            )
          })}
        </div>

        <motion.div
          className={s.ctaBlock}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={s.ctaCopy}>
            <span className={s.ctaEyebrow}>Méthode intégrée</span>
            <h3 className={s.ctaTitle}>Un parcours fluide entre relation, analyse et exécution</h3>
            <p className={s.ctaText}>
              Cette organisation permet de réduire les frictions, de mieux sécuriser les décisions
              et d&apos;assurer des livrables plus lisibles, plus fiables et plus durables.
            </p>
          </div>

          <div className={s.ctaActions}>
            <button type="button" className={s.actionPrimary} onClick={() => openModal(activeIndex)}>
              Ouvrir le pôle actif
              <ArrowIcon />
            </button>

            <a href="#contact" className={s.actionGhostLink}>
              Contacter l&apos;équipe
            </a>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedUnit && selectedIndex !== null && (
          <motion.div
            className={s.modalBackdrop}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={closeModal}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={modalTitleId}
              aria-describedby={modalDescId}
              className={s.modalShell}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className={s.closeBtn} onClick={closeModal} aria-label="Fermer la fenêtre">
                <CloseIcon />
              </button>

              <div className={s.modalMedia}>
                <img
                  src={imageErrors[selectedIndex] ? selectedUnit.fallbackImage : selectedUnit.image}
                  alt={selectedUnit.alt}
                  className={s.modalImage}
                />
                <div className={s.modalMediaOverlay} />

                <div className={s.modalBadge}>{selectedUnit.num}</div>

                <div className={s.modalHeroIcon}>
                  <UnitIcon type={selectedUnit.icon} />
                </div>

                <div className={s.modalTag}>
                  <span className={s.imgTagDot} />
                  {selectedUnit.tag}
                </div>

                <p className={s.modalCaption}>{selectedUnit.illustrationCaption}</p>
              </div>

              <div className={s.modalBody}>
                <span className={s.modalKicker}>Vue détaillée</span>
                <h3 id={modalTitleId} className={s.modalTitle}>
                  {selectedUnit.title}
                </h3>
                <p id={modalDescId} className={s.modalText}>
                  {selectedUnit.longText}
                </p>

                <div className={s.modalGrid}>
                  <section className={s.detailCard}>
                    <h4 className={s.detailTitle}>Ce que fait ce pôle</h4>
                    <ul className={s.detailList}>
                      {selectedUnit.details.map((item) => (
                        <li key={item} className={s.detailItem}>
                          <span className={s.detailDot} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className={s.detailCard}>
                    <h4 className={s.detailTitle}>Bénéfices</h4>
                    <ul className={s.detailList}>
                      {selectedUnit.benefits.map((item) => (
                        <li key={item} className={s.detailItem}>
                          <span className={s.detailDot} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className={s.processBox}>
                  <h4 className={s.detailTitle}>Processus type</h4>

                  <div className={s.processList}>
                    {selectedUnit.process.map((step, stepIndex) => (
                      <div key={step} className={s.processItem}>
                        <span className={s.processIndex}>0{stepIndex + 1}</span>
                        <span className={s.processStepText}>{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={s.toolsSection}>
                  <h4 className={s.detailTitle}>Outils & leviers</h4>
                  <div className={s.toolsWrap}>
                    {selectedUnit.tools.map((tool) => (
                      <span key={tool} className={s.toolChip}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </section>

                <div className={s.modalFooter}>
                  <div className={s.modalNav}>
                    <button type="button" className={s.actionGhost} onClick={showPrevious}>
                      <ChevronLeftIcon />
                      Précédent
                    </button>

                    <button type="button" className={s.actionGhost} onClick={showNext}>
                      Suivant
                      <ChevronRightIcon />
                    </button>
                  </div>

                  <button type="button" className={s.actionPrimary} onClick={closeModal}>
                    Fermer
                    <CloseIcon />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}