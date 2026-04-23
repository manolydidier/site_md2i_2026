'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import styles from './contact.module.css'

/* ── Data ──────────────────────────────── */
const contactCards = [
  {
    icon: <IconBuilding />,
    title: 'Direction générale',
    description: 'Partenariats stratégiques, échanges institutionnels et engagements à haut niveau de décision.',
    email: 'direction@md2i.com',
    phone: '+261 34 00 000 00',
  },
  {
    icon: <IconSales />,
    title: 'Pôle commercial',
    description: 'Présentation du cabinet, démonstrations, devis et toute demande d\'information commerciale.',
    email: 'contact@md2i.com',
    phone: '+261 34 00 000 10',
  },
  {
    icon: <IconSupport />,
    title: 'Support & formation',
    description: 'Assistance utilisateurs, sessions de prise en main et suivi opérationnel quotidien.',
    email: 'support@md2i.com',
    phone: '+261 34 00 000 03',
  },
  {
    icon: <IconCode />,
    title: 'Développement & technique',
    description: 'Évolutions logicielles, intégrations API et questions d\'architecture technique.',
    email: 'dev@md2i.com',
    phone: '+261 34 00 000 02',
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
  'Obtenir un appui technique ou une formation',
  'Être orienté vers le bon interlocuteur',
]

const SUBJECTS = ['Demande commerciale', 'Démonstration', 'Support technique', 'Partenariat', 'Recrutement', 'Autre']

/* ── Page ──────────────────────────────── */
export default function ContactPage() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const blobRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const blob = blobRef.current
    if (!blob) return
    const fn = (e: MouseEvent) => {
      const rx = ((e.clientX / window.innerWidth)  - 0.5) * 30
      const ry = ((e.clientY / window.innerHeight) - 0.5) * 20
      blob.style.transform = `translate(${rx}px, ${ry}px)`
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 1800)
  }

  return (
    <main className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.blobWrap} aria-hidden>
          <div className={styles.blob} ref={blobRef} />
        </div>

        <div className={styles.container}>
          <div className={styles.heroGrid}>

            <div className={styles.heroText}>
              <div className={styles.eyebrow}>
                <span className={styles.pulse} />
                Contact
              </div>

              <h1 className={styles.heroTitle}>
                Parlons de<br />
                <em>votre projet</em>
              </h1>

              <p className={styles.heroSub}>
                Vous souhaitez découvrir MD2I, planifier une démonstration,
                obtenir un accompagnement ou initier un partenariat ?
                Notre équipe vous répond sous 24 heures.
              </p>

              <div className={styles.heroCtas}>
                <a href="#contact-form" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Envoyer un message <span aria-hidden>→</span>
                </a>
                <Link href="/apropos" className={`${styles.btn} ${styles.btnOutline}`}>
                  Voir l'équipe
                </Link>
              </div>
            </div>

            <div className={styles.heroCards}>
              {[
                { n: '4',     u: 'équipes',  s: 'disponibles'   },
                { n: '< 24h', u: 'réponse',  s: 'garantie'      },
                { n: '2',     u: 'bureaux',  s: 'MG · FR'       },
              ].map((s, i) => (
                <div key={i} className={styles.statCard} style={{ '--i': i } as React.CSSProperties}>
                  <span className={styles.statN}>{s.n}</span>
                  <span className={styles.statU}>{s.u}</span>
                  <span className={styles.statS}>{s.s}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className={styles.cardsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <Pill>Contacts directs</Pill>
            <h2 className={styles.h2}>Le bon interlocuteur, du premier coup</h2>
            <p className={styles.sectionSub}>
              Chaque type de demande est acheminé vers l'équipe la mieux
              placée pour y répondre efficacement.
            </p>
          </div>

          <div className={styles.grid4}>
            {contactCards.map((c, i) => (
              <article
                key={c.title}
                className={`${styles.cCard} ${hovered === i ? styles.cCardHov : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}
              >
                <span className={styles.cCardBar} aria-hidden />
                <div className={styles.cIcon}>{c.icon}</div>
                <h3 className={styles.cTitle}>{c.title}</h3>
                <p className={styles.cDesc}>{c.description}</p>
                <div className={styles.cLinks}>
                  <a href={`mailto:${c.email}`} className={styles.cLink}>
                    <IconMail /> {c.email}
                  </a>
                  <a href={`tel:${c.phone.replace(/\s/g,'')}`} className={styles.cLink}>
                    <IconPhone /> {c.phone}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM + SIDE ── */}
      <section className={styles.mainSection} id="contact-form">
        <div className={styles.container}>
          <div className={styles.split}>

            {/* ── Form ── */}
            <div className={styles.formBox}>
              <div className={styles.formBoxHead}>
                <Pill>Formulaire</Pill>
                <h2 className={styles.h2}>Envoyez-nous<br />votre message</h2>
                <p className={styles.formNote}>
                  Tous les champs marqués <em>*</em> sont requis.
                  Nous vous répondons dans les 24 heures ouvrées.
                </p>
              </div>

              {sent ? (
                <div className={styles.successBox}>
                  <div className={styles.successCheck}>✓</div>
                  <strong>Message envoyé !</strong>
                  <p>Merci. Nous vous reviendrons dans les meilleurs délais.</p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className={styles.row2}>
                    <F label="Prénom *"><input type="text" placeholder="Prénom" required /></F>
                    <F label="Nom *"><input type="text" placeholder="Nom" required /></F>
                  </div>
                  <div className={styles.row2}>
                    <F label="Email *"><input type="email" placeholder="vous@organisation.com" required /></F>
                    <F label="Téléphone"><input type="tel" placeholder="+261 34 …" /></F>
                  </div>
                  <F label="Organisation">
                    <input type="text" placeholder="Nom de votre structure ou institution" />
                  </F>
                  <F label="Objet *">
                    <div className={styles.selWrap}>
                      <select required defaultValue="">
                        <option value="" disabled>Sélectionner…</option>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <span aria-hidden className={styles.selArrow}>▾</span>
                    </div>
                  </F>
                  <F label="Message *">
                    <textarea rows={5} placeholder="Décrivez votre besoin ou votre question…" required />
                  </F>

                  <div className={styles.formBottom}>
                    <p className={styles.legal}>
                      En soumettant ce formulaire vous acceptez que MD2I traite
                      vos données pour répondre à votre demande.
                    </p>
                    <button
                      type="submit"
                      disabled={sending}
                      className={`${styles.btn} ${styles.btnPrimary} ${sending ? styles.btnLoading : ''}`}
                    >
                      {sending
                        ? <span className={styles.loader} aria-hidden />
                        : <>Envoyer le message <span aria-hidden>→</span></>
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Side ── */}
            <aside className={styles.aside}>

              <div className={styles.sCard}>
                <Pill>Implantations</Pill>
                <h3 className={styles.sTitle}>Nos bureaux</h3>
                <div className={styles.officeList}>
                  {offices.map(o => (
                    <div key={o.city} className={styles.office}>
                      <div className={styles.officeHead}>
                        <span className={styles.officeFlag}>{o.flag}</span>
                        <div>
                          <strong className={styles.officeCity}>{o.city}</strong>
                          <span className={styles.officeRole}>{o.role}</span>
                        </div>
                      </div>
                      <p className={styles.officeAddr}><IconPin /> {o.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sCard}>
                <Pill>Demandes fréquentes</Pill>
                <h3 className={styles.sTitle}>Nous pouvons vous aider à</h3>
                <ul className={styles.quickList}>
                  {quickLinks.map(q => (
                    <li key={q}>
                      <a href="#contact-form" className={styles.qItem}>
                        <span className={styles.qArrow} aria-hidden>↗</span>
                        {q}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.nudge}>
                <p>Besoin d'une réponse rapide ?</p>
                <a href="mailto:contact@md2i.com" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`}>
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

/* ── Small helpers ─────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return <span className={styles.pill}>{children}</span>
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fLabel}>{label}</span>
      {children}
    </label>
  )
}

/* ── Icons ─────────────────────────────── */
const ico = (d: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
function IconBuilding() { return ico(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>) }
function IconSales()    { return ico(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>) }
function IconSupport()  { return ico(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>) }
function IconCode()     { return ico(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>) }

const sico = (d: React.ReactNode) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
function IconMail()  { return sico(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>) }
function IconPhone() { return sico(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.86 5.86l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>) }
function IconPin()   {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{flexShrink:0, marginTop:2}}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}