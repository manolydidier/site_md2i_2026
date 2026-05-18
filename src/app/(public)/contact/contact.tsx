'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './contact.module.css'

const contactCards = [
  {
    icon: <IconBuilding />,
    title: 'Direction générale',
    description:
      'Partenariats stratégiques, échanges institutionnels et décisions à haut niveau.',
    email: 'direction@md2i.com',
    phone: '+261 34 00 000 00',
    tag: 'Stratégie',
  },
  {
    icon: <IconSales />,
    title: 'Pôle commercial',
    description:
      'Présentation du cabinet, démonstrations, devis et demandes commerciales.',
    email: 'contact@md2i.com',
    phone: '+261 34 00 000 10',
    tag: 'Commercial',
  },
  {
    icon: <IconSupport />,
    title: 'Support & formation',
    description:
      'Assistance utilisateurs, formation, prise en main et suivi opérationnel.',
    email: 'support@md2i.com',
    phone: '+261 34 00 000 03',
    tag: 'Support',
  },
  {
    icon: <IconCode />,
    title: 'Développement & technique',
    description:
      'Intégrations, évolutions logicielles, API et architecture technique.',
    email: 'dev@md2i.com',
    phone: '+261 34 00 000 02',
    tag: 'Technique',
  },
]

const offices = [
  {
    city: 'Antananarivo',
    flag: '🇲🇬',
    role: 'Bureau opérationnel',
    address: 'Adresse à compléter, Antananarivo, Madagascar',
  },
  {
    city: 'Paris',
    flag: '🇫🇷',
    role: 'Représentation institutionnelle',
    address: 'Adresse à compléter, Paris, France',
  },
]

const quickLinks = [
  'Demander une présentation du cabinet',
  'Planifier une démonstration en ligne',
  'Obtenir un devis ou une proposition',
  'Recevoir un appui technique ou une formation',
  'Être orienté vers le bon interlocuteur',
]

const SUBJECTS = [
  'Demande commerciale',
  'Démonstration',
  'Devis',
  'Support technique',
  'Formation',
  'Partenariat',
  'Recrutement',
  'Autre',
]

const heroStats = [
  {
    value: '24h',
    label: 'délai moyen',
    text: 'réponse rapide',
  },
  {
    value: '4',
    label: 'pôles experts',
    text: 'commerce, support, technique, direction',
  },
  {
    value: '2',
    label: 'implantations',
    text: 'Madagascar · France',
  },
]

export default function ContactPage() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [subject, setSubject] = useState('')
  const blobRef = useRef<HTMLDivElement>(null)

  const selectedSubjectLabel = useMemo(() => {
    return subject || 'Sélectionnez un objet'
  }, [subject])

  useEffect(() => {
    const blob = blobRef.current

    if (!blob) return

    const moveBlob = (event: MouseEvent) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 34
      const y = ((event.clientY / window.innerHeight) - 0.5) * 24

      blob.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    window.addEventListener('mousemove', moveBlob)

    return () => window.removeEventListener('mousemove', moveBlob)
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSending(true)

    window.setTimeout(() => {
      setSending(false)
      setSent(true)
    }, 1200)
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroNoise} aria-hidden />
        <div className={styles.blobWrap} aria-hidden>
          <div className={styles.blob} ref={blobRef} />
          <div className={styles.blobSecondary} />
        </div>

        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <div className={styles.eyebrow}>
                <span className={styles.pulse} />
                Contact MD2I
              </div>

              <h1 className={styles.heroTitle}>
                Une question, un projet, une demande&nbsp;?
                <em> Parlons-en.</em>
              </h1>

              <p className={styles.heroSub}>
                Notre équipe vous oriente vers le bon interlocuteur pour une
                démonstration, un devis, une demande technique, une formation ou
                un partenariat stratégique.
              </p>

              <div className={styles.heroCtas}>
                <a
                  href="#contact-form"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Envoyer un message
                  <span aria-hidden>→</span>
                </a>

                <Link
                  href="/contact-commercial"
                  className={`${styles.btn} ${styles.btnDark}`}
                >
                  Demande commerciale
                </Link>

                <Link href="/apropos" className={`${styles.btn} ${styles.btnOutline}`}>
                  Découvrir MD2I
                </Link>
              </div>

              <div className={styles.trustRow}>
                <span>Réponse structurée</span>
                <span>Suivi CRM</span>
                <span>Accompagnement professionnel</span>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <div className={styles.heroPanelTop}>
                <span className={styles.panelKicker}>Disponibilité</span>
                <strong>Une équipe dédiée à votre demande</strong>
                <p>
                  Votre message est qualifié puis transmis au pôle le plus
                  adapté pour accélérer le traitement.
                </p>
              </div>

              <div className={styles.heroStats}>
                {heroStats.map((item, index) => (
                  <div
                    key={item.label}
                    className={styles.statCard}
                    style={{ '--i': index } as CSSProperties}
                  >
                    <span className={styles.statN}>{item.value}</span>
                    <span className={styles.statU}>{item.label}</span>
                    <span className={styles.statS}>{item.text}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.cardsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <Pill>Contacts directs</Pill>

            <div className={styles.sectionTitleGrid}>
              <h2 className={styles.h2}>Le bon interlocuteur, sans détour</h2>

              <p className={styles.sectionSub}>
                Sélectionnez le service adapté à votre besoin pour obtenir une
                réponse plus rapide, plus précise et mieux orientée.
              </p>
            </div>
          </div>

          <div className={styles.grid4}>
            {contactCards.map((card, index) => (
              <article
                key={card.title}
                className={`${styles.cCard} ${
                  hovered === index ? styles.cCardHov : ''
                }`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                style={{ '--delay': `${index * 80}ms` } as CSSProperties}
              >
                <span className={styles.cCardBar} aria-hidden />

                <div className={styles.cardTop}>
                  <div className={styles.cIcon}>{card.icon}</div>
                  <span className={styles.cardTag}>{card.tag}</span>
                </div>

                <h3 className={styles.cTitle}>{card.title}</h3>
                <p className={styles.cDesc}>{card.description}</p>

                <div className={styles.cLinks}>
                  <a href={`mailto:${card.email}`} className={styles.cLink}>
                    <IconMail /> {card.email}
                  </a>

                  <a
                    href={`tel:${card.phone.replace(/\s/g, '')}`}
                    className={styles.cLink}
                  >
                    <IconPhone /> {card.phone}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.mainSection} id="contact-form">
        <div className={styles.container}>
          <div className={styles.split}>
            <section className={styles.formBox}>
              <div className={styles.formBoxHead}>
                <Pill>Formulaire sécurisé</Pill>

                <h2 className={styles.h2}>
                  Envoyez-nous
                  <br />
                  votre message
                </h2>

                <p className={styles.formNote}>
                  Tous les champs marqués <em>*</em> sont requis. Votre demande
                  sera transmise au service compétent.
                </p>
              </div>

              {sent ? (
                <div className={styles.successBox}>
                  <div className={styles.successCheck}>✓</div>
                  <strong>Message envoyé</strong>
                  <p>
                    Merci pour votre demande. L’équipe MD2I vous répondra dans
                    les meilleurs délais.
                  </p>

                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline}`}
                    onClick={() => setSent(false)}
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className={styles.formStep}>
                    <span>1</span>
                    <div>
                      <strong>Vos coordonnées</strong>
                      <p>Nous utiliserons ces informations pour vous répondre.</p>
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <F label="Prénom *">
                      <input type="text" placeholder="Votre prénom" required />
                    </F>

                    <F label="Nom *">
                      <input type="text" placeholder="Votre nom" required />
                    </F>
                  </div>

                  <div className={styles.row2}>
                    <F label="Email *">
                      <input
                        type="email"
                        placeholder="vous@organisation.com"
                        required
                      />
                    </F>

                    <F label="Téléphone">
                      <input type="tel" placeholder="+261 34 ..." />
                    </F>
                  </div>

                  <F label="Organisation">
                    <input
                      type="text"
                      placeholder="Nom de votre entreprise ou institution"
                    />
                  </F>

                  <div className={styles.formStep}>
                    <span>2</span>
                    <div>
                      <strong>Votre demande</strong>
                      <p>Sélectionnez l’objet puis décrivez votre besoin.</p>
                    </div>
                  </div>

                  <F label="Objet *">
                    <div className={styles.selWrap}>
                      <select
                        required
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                      >
                        <option value="" disabled>
                          Sélectionner...
                        </option>

                        {SUBJECTS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      <span aria-hidden className={styles.selArrow}>
                        ▾
                      </span>
                    </div>
                  </F>

                  <F label="Message *">
                    <textarea
                      rows={6}
                      placeholder="Décrivez votre besoin, votre contexte, votre délai ou votre question..."
                      required
                    />
                  </F>

                  <div className={styles.requestSummary}>
                    <span>Résumé de la demande</span>
                    <strong>{selectedSubjectLabel}</strong>
                    <p>
                      Votre message sera traité par l’équipe MD2I et orienté
                      vers le pôle compétent.
                    </p>
                  </div>

                  <div className={styles.formBottom}>
                    <p className={styles.legal}>
                      En soumettant ce formulaire, vous acceptez que MD2I traite
                      vos données afin de répondre à votre demande.
                    </p>

                    <button
                      type="submit"
                      disabled={sending}
                      className={`${styles.btn} ${styles.btnPrimary} ${
                        sending ? styles.btnLoading : ''
                      }`}
                    >
                      {sending ? (
                        <>
                          <span className={styles.loader} aria-hidden />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          Envoyer le message <span aria-hidden>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <aside className={styles.aside}>
              <div className={styles.sCard}>
                <Pill>Implantations</Pill>

                <h3 className={styles.sTitle}>Nos bureaux</h3>

                <div className={styles.officeList}>
                  {offices.map((office) => (
                    <div key={office.city} className={styles.office}>
                      <div className={styles.officeHead}>
                        <span className={styles.officeFlag}>{office.flag}</span>

                        <div>
                          <strong className={styles.officeCity}>
                            {office.city}
                          </strong>
                          <span className={styles.officeRole}>
                            {office.role}
                          </span>
                        </div>
                      </div>

                      <p className={styles.officeAddr}>
                        <IconPin /> {office.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sCard}>
                <Pill>Demandes fréquentes</Pill>

                <h3 className={styles.sTitle}>Nous pouvons vous aider à</h3>

                <ul className={styles.quickList}>
                  {quickLinks.map((item) => (
                    <li key={item}>
                      <a href="#contact-form" className={styles.qItem}>
                        <span className={styles.qArrow} aria-hidden>
                          ↗
                        </span>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.nudge}>
                <span className={styles.nudgeLabel}>Prioritaire</span>
                <p>Besoin d’une réponse rapide&nbsp;?</p>

                <a
                  href="mailto:contact@md2i.com"
                  className={`${styles.btn} ${styles.btnFull}`}
                >
                  Écrire directement →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return <span className={styles.pill}>{children}</span>
}

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fLabel}>{label}</span>
      {children}
    </label>
  )
}

const ico = (children: ReactNode) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

function IconBuilding() {
  return ico(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  )
}

function IconSales() {
  return ico(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />)
}

function IconSupport() {
  return ico(
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  )
}

function IconCode() {
  return ico(
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  )
}

const sico = (children: ReactNode) => (
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
    {children}
  </svg>
)

function IconMail() {
  return sico(
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  )
}

function IconPhone() {
  return sico(
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.86 5.86l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  )
}

function IconPin() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}