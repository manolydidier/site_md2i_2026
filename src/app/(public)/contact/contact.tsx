'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import styles from './contact.module.css'

type FieldName =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'organization'
  | 'subject'
  | 'message'
  | 'website'
  | 'formStartedAt'

type FieldErrors = Partial<Record<FieldName, string>>

type ContactApiResponse = {
  ok?: boolean
  id?: string
  error?: string
  emailError?: string
  fieldErrors?: FieldErrors
}

const contactCardDefs = [
  {
    icon: <IconBuilding />,
    key: 'direction',
    email: 'direction@md2i.com',
    phone: '+261 34 00 000 00',
  },
  {
    icon: <IconSales />,
    key: 'sales',
    email: 'contact@md2i.com',
    phone: '+261 34 00 000 10',
  },
  {
    icon: <IconSupport />,
    key: 'support',
    email: 'support@md2i.com',
    phone: '+261 34 00 000 03',
  },
  {
    icon: <IconCode />,
    key: 'technical',
    email: 'dev@md2i.com',
    phone: '+261 34 00 000 02',
  },
] as const

const officeDefs = [
  {
    city: 'Antananarivo',
    flag: '🇲🇬',
    roleKey: 'contactPage.offices.operational',
    addressKey: 'contactPage.offices.tanaAddress',
  },
  {
    city: 'Paris',
    flag: '🇫🇷',
    roleKey: 'contactPage.offices.institutional',
    addressKey: 'contactPage.offices.parisAddress',
  },
] as const

const quickLinkKeys = [
  'presentation',
  'demo',
  'quote',
  'support',
  'routing',
] as const

const subjectKeys = [
  'sales',
  'demo',
  'quote',
  'support',
  'training',
  'partnership',
  'recruitment',
  'other',
] as const

const heroStats = [
  {
    value: '24h',
    labelKey: 'contactPage.stats.delayLabel',
    textKey: 'contactPage.stats.delayText',
  },
  {
    value: '4',
    labelKey: 'contactPage.stats.polesLabel',
    textKey: 'contactPage.stats.polesText',
  },
  {
    value: '2',
    labelKey: 'contactPage.stats.officesLabel',
    textKey: 'contactPage.stats.officesText',
  },
]

function valueOf(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone: string) {
  if (!phone) return true
  return /^[+()\d\s.-]{6,30}$/.test(phone)
}

function validateFront(
  formData: FormData,
  subjects: string[],
  translate: (key: string) => string,
) {
  const errors: FieldErrors = {}

  const firstName = valueOf(formData, 'firstName')
  const lastName = valueOf(formData, 'lastName')
  const email = valueOf(formData, 'email').toLowerCase()
  const phone = valueOf(formData, 'phone')
  const organization = valueOf(formData, 'organization')
  const subject = valueOf(formData, 'subject')
  const message = valueOf(formData, 'message')
  const website = valueOf(formData, 'website')

  if (website) {
    errors.website = translate('contactPage.validation.blocked')
  }

  if (!firstName) {
    errors.firstName = translate('contactPage.validation.firstNameRequired')
  } else if (firstName.length < 2) {
    errors.firstName = translate('contactPage.validation.min2')
  }

  if (!lastName) {
    errors.lastName = translate('contactPage.validation.lastNameRequired')
  } else if (lastName.length < 2) {
    errors.lastName = translate('contactPage.validation.min2')
  }

  if (!email) {
    errors.email = translate('contactPage.validation.emailRequired')
  } else if (!isValidEmail(email)) {
    errors.email = translate('contactPage.validation.emailInvalid')
  }

  if (phone && !isValidPhone(phone)) {
    errors.phone = translate('contactPage.validation.phoneInvalid')
  }

  if (organization.length > 120) {
    errors.organization = translate('contactPage.validation.max120')
  }

  if (!subject) {
    errors.subject = translate('contactPage.validation.subjectRequired')
  } else if (!subjects.includes(subject)) {
    errors.subject = translate('contactPage.validation.subjectInvalid')
  }

  if (!message) {
    errors.message = translate('contactPage.validation.messageRequired')
  } else if (message.length < 10) {
    errors.message = translate('contactPage.validation.min10')
  } else if (message.length > 5000) {
    errors.message = translate('contactPage.validation.max5000')
  }

  return errors
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentId, setSentId] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [subject, setSubject] = useState('')
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now())
  const blobRef = useRef<HTMLDivElement>(null)
  const subjects = useMemo(
    () => subjectKeys.map((key) => t(`contactPage.subjects.${key}`)),
    [t],
  )
  const contactCards = useMemo(
    () =>
      contactCardDefs.map((card) => ({
        ...card,
        title: t(`contactPage.cards.${card.key}.title`),
        description: t(`contactPage.cards.${card.key}.description`),
        tag: t(`contactPage.cards.${card.key}.tag`),
      })),
    [t],
  )
  const offices = useMemo(
    () =>
      officeDefs.map((office) => ({
        ...office,
        role: t(office.roleKey),
        address: t(office.addressKey),
      })),
    [t],
  )
  const quickLinks = useMemo(
    () => quickLinkKeys.map((key) => t(`contactPage.frequent.${key}`)),
    [t],
  )

  const selectedSubjectLabel = useMemo(() => {
    return subject || t('contactPage.form.summaryFallback')
  }, [subject, t])

  useEffect(() => {
    const blob = blobRef.current

    if (!blob) return

    const moveBlob = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 34
      const y = (event.clientY / window.innerHeight - 0.5) * 24

      blob.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    window.addEventListener('mousemove', moveBlob)

    return () => window.removeEventListener('mousemove', moveBlob)
  }, [])

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev

      const next = { ...prev }
      delete next[field]
      return next
    })

    if (error) {
      setError('')
    }
  }

  const resetAfterSuccess = () => {
    setSent(false)
    setSentId('')
    setError('')
    setFieldErrors({})
    setFormStartedAt(Date.now())
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const clientErrors = validateFront(formData, subjects, t)

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setError(t('contactPage.validation.fixFields'))
      return
    }

    setSending(true)
    setSent(false)
    setSentId('')
    setError('')
    setFieldErrors({})

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          organization: formData.get('organization'),
          subject: formData.get('subject'),
          message: formData.get('message'),
          website: formData.get('website'),
          formStartedAt,
        }),
      })

      const data = (await response
        .json()
        .catch(() => null)) as ContactApiResponse | null

      if (!response.ok || !data?.ok) {
        if (data?.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        }

        throw new Error(
          data?.error ||
            data?.emailError ||
            t('contactPage.validation.sendFailed')
        )
      }

      form.reset()
      setSubject('')
      setFormStartedAt(Date.now())
      setSentId(data.id || '')
      setSent(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('contactPage.validation.sendError')
      )
    } finally {
      setSending(false)
    }
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
                {t('contactPage.heroEyebrow')}
              </div>

              <h1 className={styles.heroTitle}>
                {t('contactPage.title')}
                <em> {t('contactPage.titleEmphasis')}</em>
              </h1>

              <p className={styles.heroSub}>
                {t('contactPage.subtitle')}
              </p>

              <div className={styles.heroCtas}>
                <a
                  href="#contact-form"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  {t('contactPage.ctaMessage')}
                  <span aria-hidden>→</span>
                </a>

                <Link
                  href="/contact-commercial"
                  className={`${styles.btn} ${styles.btnDark}`}
                >
                  {t('contactPage.ctaSales')}
                </Link>

                <Link href="/apropos" className={`${styles.btn} ${styles.btnOutline}`}>
                  {t('contactPage.ctaDiscover')}
                </Link>
              </div>

              <div className={styles.trustRow}>
                <span>{t('contactPage.trust.response')}</span>
                <span>{t('contactPage.trust.crm')}</span>
                <span>{t('contactPage.trust.support')}</span>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <div className={styles.heroPanelTop}>
                <span className={styles.panelKicker}>
                  {t('contactPage.availability.kicker')}
                </span>
                <strong>{t('contactPage.availability.title')}</strong>
                <p>
                  {t('contactPage.availability.text')}
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
                    <span className={styles.statU}>{t(item.labelKey)}</span>
                    <span className={styles.statS}>{t(item.textKey)}</span>
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
            <Pill>{t('contactPage.cards.pill')}</Pill>

            <div className={styles.sectionTitleGrid}>
              <h2 className={styles.h2}>{t('contactPage.cards.title')}</h2>

              <p className={styles.sectionSub}>
                {t('contactPage.cards.subtitle')}
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
                <Pill>{t('contactPage.form.pill')}</Pill>

                <h2 className={styles.h2}>
                  {t('contactPage.form.titleLine1')}
                  <br />
                  {t('contactPage.form.titleLine2')}
                </h2>

                <p className={styles.formNote}>
                  {t('contactPage.form.note')}
                </p>
              </div>

              {sent ? (
                <div className={styles.successBox}>
                  <div className={styles.successCheck}>✓</div>
                  <strong>{t('contactPage.form.successTitle')}</strong>
                  <p>
                    {t('contactPage.form.successText')}
                  </p>

                  {sentId ? (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        opacity: 0.65,
                        fontWeight: 700,
                      }}
                    >
                      {t('contactPage.form.reference', { id: sentId })}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline}`}
                    onClick={resetAfterSuccess}
                  >
                    {t('contactPage.form.anotherMessage')}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    onChange={() => clearFieldError('website')}
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: 1,
                      height: 1,
                      opacity: 0,
                    }}
                  />

                  <input
                    type="hidden"
                    name="formStartedAt"
                    value={formStartedAt}
                    readOnly
                  />

                  <div className={styles.formStep}>
                    <span>1</span>
                    <div>
                      <strong>{t('contactPage.form.stepContact')}</strong>
                      <p>{t('contactPage.form.stepContactText')}</p>
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <F label={t('contactPage.form.firstName')} error={fieldErrors.firstName}>
                      <input
                        name="firstName"
                        type="text"
                        placeholder={t('contactPage.form.firstNamePlaceholder')}
                        required
                        maxLength={50}
                        autoComplete="given-name"
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        onChange={() => clearFieldError('firstName')}
                      />
                    </F>

                    <F label={t('contactPage.form.lastName')} error={fieldErrors.lastName}>
                      <input
                        name="lastName"
                        type="text"
                        placeholder={t('contactPage.form.lastNamePlaceholder')}
                        required
                        maxLength={50}
                        autoComplete="family-name"
                        aria-invalid={Boolean(fieldErrors.lastName)}
                        onChange={() => clearFieldError('lastName')}
                      />
                    </F>
                  </div>

                  <div className={styles.row2}>
                    <F label={t('contactPage.form.email')} error={fieldErrors.email}>
                      <input
                        name="email"
                        type="email"
                        placeholder="vous@organisation.com"
                        required
                        maxLength={255}
                        autoComplete="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        onChange={() => clearFieldError('email')}
                      />
                    </F>

                    <F label={t('contactPage.form.phone')} error={fieldErrors.phone}>
                      <input
                        name="phone"
                        type="tel"
                        placeholder={t('contactPage.form.phonePlaceholder')}
                        maxLength={30}
                        autoComplete="tel"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        onChange={() => clearFieldError('phone')}
                      />
                    </F>
                  </div>

                  <F label={t('contactPage.form.organization')} error={fieldErrors.organization}>
                    <input
                      name="organization"
                      type="text"
                      placeholder={t('contactPage.form.organizationPlaceholder')}
                      maxLength={120}
                      autoComplete="organization"
                      aria-invalid={Boolean(fieldErrors.organization)}
                      onChange={() => clearFieldError('organization')}
                    />
                  </F>

                  <div className={styles.formStep}>
                    <span>2</span>
                    <div>
                      <strong>{t('contactPage.form.stepRequest')}</strong>
                      <p>{t('contactPage.form.stepRequestText')}</p>
                    </div>
                  </div>

                  <F label={t('contactPage.form.subject')} error={fieldErrors.subject}>
                    <div className={styles.selWrap}>
                      <select
                        name="subject"
                        required
                        value={subject}
                        aria-invalid={Boolean(fieldErrors.subject)}
                        onChange={(event) => {
                          setSubject(event.target.value)
                          clearFieldError('subject')
                        }}
                      >
                        <option value="" disabled>
                          {t('contactPage.form.subjectPlaceholder')}
                        </option>

                        {subjects.map((item) => (
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

                  <F label={t('contactPage.form.message')} error={fieldErrors.message}>
                    <textarea
                      name="message"
                      rows={6}
                      placeholder={t('contactPage.form.messagePlaceholder')}
                      required
                      maxLength={5000}
                      aria-invalid={Boolean(fieldErrors.message)}
                      onChange={() => clearFieldError('message')}
                    />
                  </F>

                  <div className={styles.requestSummary}>
                    <span>{t('contactPage.form.summaryTitle')}</span>
                    <strong>{selectedSubjectLabel}</strong>
                    <p>
                      {t('contactPage.form.summaryText')}
                    </p>
                  </div>

                  {error ? (
                    <div
                      role="alert"
                      style={{
                        marginTop: 16,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: 'rgba(239, 68, 68, 0.10)',
                        border: '1px solid rgba(239, 68, 68, 0.28)',
                        color: '#EF4444',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <div className={styles.formBottom}>
                    <p className={styles.legal}>
                      {t('contactPage.form.legal')}
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
                          {t('contactPage.form.sending')}
                        </>
                      ) : (
                        <>
                          {t('contactPage.form.submit')} <span aria-hidden>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <aside className={styles.aside}>
              <div className={styles.sCard}>
                <Pill>{t('contactPage.offices.pill')}</Pill>

                <h3 className={styles.sTitle}>
                  {t('contactPage.offices.title')}
                </h3>

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
                <Pill>{t('contactPage.frequent.pill')}</Pill>

                <h3 className={styles.sTitle}>
                  {t('contactPage.frequent.title')}
                </h3>

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
                <span className={styles.nudgeLabel}>
                  {t('contactPage.nudge.label')}
                </span>
                <p>{t('contactPage.nudge.text')}</p>

                <a
                  href="mailto:contact@md2i.com"
                  className={`${styles.btn} ${styles.btnFull}`}
                >
                  {t('contactPage.nudge.cta')}
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

function F({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className={styles.field}>
      <span
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span className={styles.fLabel}>{label}</span>

        {error ? (
          <span
            style={{
              color: '#EF4444',
              fontSize: 11,
              fontWeight: 800,
              textAlign: 'right',
            }}
          >
            {error}
          </span>
        ) : null}
      </span>

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
