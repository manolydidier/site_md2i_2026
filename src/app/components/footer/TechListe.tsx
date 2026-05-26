'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/app/context/ThemeContext'

type TechLevel = 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert'

type TechItem = {
  name: string
  short: string
  logo?: string
  level?: TechLevel
  years?: number
  description?: string
  certified?: boolean
  trending?: boolean
  isNew?: boolean
  projects?: string[]
}

type TechCategory = {
  title: string
  description: string
  color: string
  size: 'normal' | 'wide'
  items: TechItem[]
  hidden?: boolean
}

type ViewMode = 'grid' | 'list' | 'compact' | 'marquee'
type SortBy = 'name' | 'level' | 'years' | 'trending'

const ORANGE = '#EF9F27'
const GOLD = '#F7C060'
const CREAM = '#FFD382'
const MAX_COMPARE = 2

const LEVEL_ORDER = {
  Expert: 4,
  Avancé: 3,
  Intermédiaire: 2,
  Débutant: 1,
} satisfies Record<TechLevel, number>

const LEVEL_TRANSLATION_KEYS = {
  Débutant: 'beginner',
  Intermédiaire: 'intermediate',
  Avancé: 'advanced',
  Expert: 'expert',
} satisfies Record<TechLevel, string>

const DEFAULT_LEVEL: TechLevel = 'Intermédiaire'

function si(slug: string, color: string) {
  return `https://cdn.simpleicons.org/${slug}/${color.replace('#', '')}`
}

function getTokens(dark: boolean) {
  return {
    dark,

    bg: dark ? '#0F0D0A' : '#ffffff',

    surface1: dark ? 'rgba(27, 23, 18, 0.74)' : 'rgba(255, 255, 255, 0.64)',
    surface2: dark ? 'rgba(24, 21, 16, 0.88)' : 'rgba(255, 255, 255, 0.82)',
    surface3: dark ? 'rgba(18, 16, 13, 0.96)' : '#FFFFFF',

    panel: dark ? 'rgba(32, 28, 22, 0.68)' : 'rgba(255, 250, 242, 0.82)',
    panelStrong: dark ? 'rgba(24, 21, 16, 0.96)' : 'rgba(255, 255, 255, 0.92)',

    cardBg: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent), rgba(24,21,16,0.88)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent), rgba(255,255,255,0.82)',

    itemBg: dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.72)',
    itemHover: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.94)',

    text: dark ? '#F5EFE8' : '#15110B',
    softText: dark ? '#C1B8AD' : '#514B43',
    subtleText: dark ? '#91877B' : '#8F877E',

    border: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17, 12, 7, 0.08)',
    borderStrong: dark ? 'rgba(239, 159, 39, 0.24)' : 'rgba(239, 159, 39, 0.18)',
    itemBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(17, 12, 7, 0.08)',

    shadowSm: dark ? '0 4px 12px rgba(0,0,0,0.24)' : '0 4px 12px rgba(18, 15, 11, 0.05)',
    shadowMd: dark ? '0 18px 38px rgba(0,0,0,0.34)' : '0 18px 38px rgba(20, 15, 10, 0.08)',
    shadowLg: dark ? '0 30px 70px rgba(0,0,0,0.46)' : '0 26px 60px rgba(24, 18, 11, 0.12)',

    accent: ORANGE,
    accent2: GOLD,
    accent3: CREAM,

    accentSoft: dark ? 'rgba(239, 159, 39, 0.12)' : 'rgba(239, 159, 39, 0.08)',

    success: '#22C55E',

    stickyBg: dark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent), rgba(27, 23, 18, 0.82)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent), rgba(255,255,255,0.70)',

    stickyBorder: dark ? 'rgba(255, 208, 128, 0.16)' : 'rgba(239, 159, 39, 0.16)',

    modalBackdrop: dark ? 'rgba(0,0,0,0.64)' : 'rgba(8, 7, 6, 0.42)',

    orb1: dark
      ? 'radial-gradient(circle at top left, rgba(239,159,39,0.20), transparent 24%)'
      : 'radial-gradient(circle at top left, rgba(239,159,39,0.10), transparent 24%)',

    orb2: dark
      ? 'radial-gradient(circle at bottom right, rgba(247,192,96,0.14), transparent 26%)'
      : 'radial-gradient(circle at bottom right, rgba(247,192,96,0.09), transparent 26%)',

    orb3: dark
      ? 'radial-gradient(circle at 50% 100%, rgba(255, 211, 130, 0.08), transparent 30%)'
      : 'radial-gradient(circle at 50% 100%, rgba(255, 211, 130, 0.06), transparent 30%)',

    gridPattern: dark
      ? 'linear-gradient(rgba(255, 200, 120, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 200, 120, 0.03) 1px, transparent 1px)'
      : 'linear-gradient(rgba(239, 159, 39, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 159, 39, 0.04) 1px, transparent 1px)',
  }
}

function getCategoryFrame(dark: boolean) {
  const unifiedColor = ORANGE

  return {
    border: dark ? `${unifiedColor}22` : `${unifiedColor}18`,
    insetGlow: dark
      ? `inset 0 1px 0 rgba(255,255,255,0.03)`
      : `inset 0 1px 0 rgba(255,255,255,0.55)`,
    outerGlow: dark ? `0 10px 30px ${unifiedColor}12` : `0 10px 26px ${unifiedColor}0D`,
    topLine: `linear-gradient(90deg, transparent 0%, ${unifiedColor}55 35%, ${unifiedColor}80 50%, ${unifiedColor}55 65%, transparent 100%)`,
    softOverlay: dark
      ? `linear-gradient(135deg, ${unifiedColor}10 0%, transparent 55%)`
      : `linear-gradient(135deg, ${unifiedColor}0B 0%, transparent 55%)`,
  }
}

function sortItems(items: TechItem[], sortBy: SortBy) {
  const next = [...items]

  if (sortBy === 'level') {
    next.sort(
      (a, b) =>
        (LEVEL_ORDER[b.level as keyof typeof LEVEL_ORDER] || 0) -
        (LEVEL_ORDER[a.level as keyof typeof LEVEL_ORDER] || 0)
    )
  } else if (sortBy === 'years') {
    next.sort((a, b) => (b.years || 0) - (a.years || 0))
  } else if (sortBy === 'trending') {
    next.sort((a, b) => Number(Boolean(b.trending)) - Number(Boolean(a.trending)))
  } else {
    next.sort((a, b) => a.name.localeCompare(b.name))
  }

  return next
}

function levelLabel(t: TFunction, level?: TechLevel) {
  return t(`techList.levels.${LEVEL_TRANSLATION_KEYS[level ?? DEFAULT_LEVEL]}`)
}

function experienceLabel(t: TFunction, years?: number) {
  return t('techList.yearsExperience', { count: years ?? 2 })
}

function compactExperienceLabel(t: TFunction, years?: number) {
  return t('techList.yearsCompact', { count: years ?? 2 })
}

function techCountLabel(t: TFunction, count: number) {
  return t('techList.techCount', { count })
}

function translateTechText(t: TFunction, key: string, defaultValue: string) {
  return t(key, { defaultValue })
}

function localizeTechCategories(t: TFunction): TechCategory[] {
  return TECH_CATEGORIES.map((category, categoryIndex) => ({
    ...category,
    title: translateTechText(t, `techList.categories.${categoryIndex}.title`, category.title),
    description: translateTechText(
      t,
      `techList.categories.${categoryIndex}.description`,
      category.description
    ),
    items: category.items.map((item, itemIndex) => ({
      ...item,
      description: item.description
        ? translateTechText(
            t,
            `techList.categories.${categoryIndex}.items.${itemIndex}.description`,
            item.description
          )
        : item.description,
    })),
  }))
}

const TECH_CATEGORIES: TechCategory[] = [
  {
    title: 'Frontend',
    description: 'Interfaces modernes, fluides et cohérentes.',
    color: '#38BDF8',
    size: 'normal',
    items: [
      {
        name: 'React',
        short: 'R',
        logo: si('react', '#61DAFB'),
        level: 'Expert',
        years: 5,
        description: 'Bibliothèque JavaScript pour construire des interfaces utilisateur',
        certified: true,
        trending: true,
        projects: ['Dashboard Analytics', 'E-commerce Platform'],
      },
      {
        name: 'Next.js',
        short: 'N',
        logo: si('nextdotjs', '#000000'),
        level: 'Avancé',
        years: 3,
        description: 'Framework React pour le rendu côté serveur',
        certified: false,
        trending: true,
        isNew: true,
        projects: ['Portfolio', 'Blog Platform'],
      },
      {
        name: 'TypeScript',
        short: 'TS',
        logo: si('typescript', '#3178C6'),
        level: 'Expert',
        years: 4,
        description: 'Superset typé de JavaScript',
        certified: true,
        trending: true,
        projects: ['All projects'],
      },
      {
        name: 'JavaScript',
        short: 'JS',
        logo: si('javascript', '#F7DF1E'),
        level: 'Expert',
        years: 6,
        description: 'Langage de programmation web',
        certified: true,
        trending: false,
        projects: ['Legacy Systems', 'Modern Apps'],
      },
      {
        name: 'Figma',
        short: 'Fg',
        logo: si('figma', '#F24E1E'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Outil de design collaboratif',
        certified: false,
        trending: true,
        projects: ['UI/UX Designs'],
      },
      {
        name: 'Tailwind CSS',
        short: 'Tw',
        logo: si('tailwindcss', '#06B6D4'),
        level: 'Avancé',
        years: 3,
        description: 'Framework CSS utilitaire',
        certified: false,
        trending: true,
        projects: ['Modern Web Apps'],
      },
    ],
  },
  {
    title: 'Backend',
    description: 'Architecture, APIs, logique métier et intégrations.',
    color: '#10B981',
    size: 'wide',
    items: [
      {
        name: 'Node.js',
        short: 'Nd',
        logo: si('nodedotjs', '#5FA04E'),
        level: 'Avancé',
        years: 4,
        description: 'Runtime JavaScript côté serveur',
        certified: true,
        trending: true,
        projects: ['REST APIs', 'Microservices'],
      },
      {
        name: 'Java',
        short: 'Jv',
        logo: si('openjdk', '#ED8B00'),
        level: 'Expert',
        years: 7,
        description: 'Langage orienté objet robuste',
        certified: true,
        trending: false,
        projects: ['Enterprise Apps', 'Banking Systems'],
      },
      {
        name: 'Spring Boot',
        short: 'SB',
        logo: si('springboot', '#6DB33F'),
        level: 'Avancé',
        years: 4,
        description: 'Framework Java pour microservices',
        certified: true,
        trending: true,
        projects: ['Microservices Architecture'],
      },
      {
        name: 'C#',
        short: 'C#',
        logo: si('csharp', '#7C3AED'),
        level: 'Intermédiaire',
        years: 3,
        description: 'Langage moderne de Microsoft',
        certified: false,
        trending: false,
        projects: ['Desktop Apps'],
      },
      {
        name: '.NET',
        short: '.N',
        logo: si('dotnet', '#512BD4'),
        level: 'Intermédiaire',
        years: 3,
        description: 'Framework Microsoft',
        certified: false,
        trending: false,
        projects: ['Enterprise Solutions'],
      },
      {
        name: 'Express.js',
        short: 'Ex',
        logo: si('express', '#444444'),
        level: 'Avancé',
        years: 4,
        description: 'Framework Node.js minimaliste',
        certified: false,
        trending: true,
        projects: ['REST APIs', 'Backend Services'],
      },
      {
        name: 'ZK Framework',
        short: 'ZK',
        level: 'Intermédiaire',
        years: 2,
        description: 'Framework Java pour UI riches',
        certified: false,
        trending: false,
        projects: ['Enterprise Web Apps'],
      },
      {
        name: 'Laravel',
        short: 'Lv',
        logo: si('laravel', '#FF2D20'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Framework PHP élégant',
        certified: false,
        trending: false,
        projects: ['Web Apps'],
      },
      {
        name: 'Python',
        short: 'Py',
        logo: si('python', '#3776AB'),
        level: 'Avancé',
        years: 5,
        description: 'Langage polyvalent',
        certified: true,
        trending: true,
        projects: ['Data Science', 'APIs', 'Automation'],
      },
    ],
  },
  {
    title: 'Bases de données',
    description: 'Stockage, cache, temps réel et performance.',
    color: '#8B5CF6',
    size: 'normal',
    items: [
      {
        name: 'PostgreSQL',
        short: 'Pg',
        logo: si('postgresql', '#4169E1'),
        level: 'Avancé',
        years: 4,
        description: 'Base de données relationnelle avancée',
        certified: true,
        trending: true,
        projects: ['Analytics DB', 'Production DB'],
      },
      {
        name: 'MySQL',
        short: 'My',
        logo: si('mysql', '#4479A1'),
        level: 'Expert',
        years: 6,
        description: 'Base de données populaire',
        certified: true,
        trending: false,
        projects: ['Legacy Systems', 'Web Apps'],
      },
      {
        name: 'MongoDB',
        short: 'Mg',
        logo: si('mongodb', '#47A248'),
        level: 'Avancé',
        years: 3,
        description: 'Base de données NoSQL',
        certified: false,
        trending: true,
        projects: ['Big Data', 'Real-time Apps'],
      },
      {
        name: 'Redis',
        short: 'Rd',
        logo: si('redis', '#DC382D'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Cache et base de données en mémoire',
        certified: false,
        trending: true,
        projects: ['Caching Layer', 'Session Management'],
      },
      {
        name: 'Firebase',
        short: 'Fb',
        logo: si('firebase', '#FFCA28'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Plateforme BaaS de Google',
        certified: false,
        trending: true,
        projects: ['Real-time Apps', 'Mobile Backend'],
      },
    ],
  },
  {
    title: 'DevOps & Cloud',
    description: 'Déploiement, orchestration, serveurs et delivery.',
    color: '#F59E0B',
    size: 'wide',
    items: [
      {
        name: 'Docker',
        short: 'Dc',
        logo: si('docker', '#2496ED'),
        level: 'Avancé',
        years: 4,
        description: "Conteneurisation d'applications",
        certified: true,
        trending: true,
        projects: ['Microservices', 'CI/CD Pipeline'],
      },
      {
        name: 'Kubernetes',
        short: 'K8',
        logo: si('kubernetes', '#326CE5'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Orchestration de conteneurs',
        certified: false,
        trending: true,
        isNew: true,
        projects: ['Cloud Infrastructure'],
      },
      {
        name: 'AWS',
        short: 'AWS',
        logo: si('amazonwebservices', '#FF9900'),
        level: 'Avancé',
        years: 3,
        description: 'Cloud computing Amazon',
        certified: true,
        trending: true,
        projects: ['Cloud Migration', 'Serverless'],
      },
      {
        name: 'Azure',
        short: 'Az',
        logo: si('microsoftazure', '#0078D4'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Cloud Microsoft',
        certified: false,
        trending: false,
        projects: ['Enterprise Cloud'],
      },
      {
        name: 'Git / CI-CD',
        short: 'Git',
        logo: si('git', '#F05032'),
        level: 'Expert',
        years: 6,
        description: 'Contrôle de version et intégration continue',
        certified: true,
        trending: true,
        projects: ['All projects'],
      },
      {
        name: 'SVN',
        short: 'SVN',
        logo: si('subversion', '#809CC9'),
        level: 'Avancé',
        years: 4,
        description: 'Système de contrôle de version',
        certified: false,
        trending: false,
        projects: ['Legacy Projects'],
      },
      {
        name: 'Nginx',
        short: 'Nx',
        logo: si('nginx', '#009639'),
        level: 'Avancé',
        years: 3,
        description: 'Serveur web et reverse proxy',
        certified: false,
        trending: true,
        projects: ['Web Servers', 'Load Balancing'],
      },
      {
        name: 'Tomcat',
        short: 'Tc',
        logo: si('apachetomcat', '#F8DC75'),
        level: 'Avancé',
        years: 4,
        description: "Serveur d'applications Java",
        certified: false,
        trending: false,
        projects: ['Java EE Apps'],
      },
    ],
  },
  {
    title: 'Monitoring & Observabilité',
    description: 'Métriques, logs, alertes et visualisation.',
    color: '#EF4444',
    size: 'normal',
    items: [
      {
        name: 'Kibana',
        short: 'Kb',
        logo: si('kibana', '#005571'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Visualisation de données Elasticsearch',
        certified: false,
        trending: false,
        projects: ['Log Analysis'],
      },
      {
        name: 'Elasticsearch',
        short: 'Es',
        logo: si('elasticsearch', '#005571'),
        level: 'Intermédiaire',
        years: 2,
        description: "Moteur de recherche et d'analyse",
        certified: false,
        trending: true,
        projects: ['Search Engine', 'Log Analytics'],
      },
      {
        name: 'Prometheus',
        short: 'Pr',
        logo: si('prometheus', '#E6522C'),
        level: 'Débutant',
        years: 1,
        description: 'Monitoring et alerting',
        certified: false,
        trending: true,
        isNew: true,
        projects: ['Metrics Collection'],
      },
      {
        name: 'Grafana',
        short: 'Gr',
        logo: si('grafana', '#F46800'),
        level: 'Intermédiaire',
        years: 2,
        description: 'Visualisation de métriques',
        certified: false,
        trending: true,
        projects: ['Dashboards', 'Analytics'],
      },
    ],
  },
]

function ViewSelector({
  view,
  setView,
  theme,
}: {
  view: ViewMode
  setView: (view: ViewMode) => void
  theme: ReturnType<typeof getTokens>
}) {
  const { t } = useTranslation()
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'grid', label: t('techList.viewModes.grid') },
    { key: 'list', label: t('techList.viewModes.list') },
    { key: 'compact', label: t('techList.viewModes.compact') },
    { key: 'marquee', label: t('techList.viewModes.marquee') },
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: theme.panel,
        border: `1px solid ${theme.stickyBorder}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexWrap: 'wrap',
      }}
    >
      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => setView(mode.key)}
          style={{
            minHeight: 36,
            padding: '0 14px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            background:
              view === mode.key
                ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`
                : 'transparent',
            color: view === mode.key ? '#FFFFFF' : theme.softText,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: view === mode.key ? '0 8px 18px rgba(239,159,39,0.20)' : 'none',
            transition: 'all 0.22s ease',
          }}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

function SortSelector({
  sortBy,
  setSortBy,
  theme,
}: {
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  theme: ReturnType<typeof getTokens>
}) {
  const { t } = useTranslation()

  return (
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as SortBy)}
      style={{
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 999,
        border: `1px solid ${theme.stickyBorder}`,
        background: theme.panel,
        color: theme.text,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        outline: 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <option value="name">{t('techList.sort.name')}</option>
      <option value="level">{t('techList.sort.level')}</option>
      <option value="years">{t('techList.sort.years')}</option>
      <option value="trending">{t('techList.sort.trending')}</option>
    </select>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 24,
        padding: '0 9px',
        borderRadius: 999,
        background: `${color}14`,
        border: `1px solid ${color}22`,
        color,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

function Stars({ level }: { level: string }) {
  const levels = {
    Débutant: 1,
    Intermédiaire: 2,
    Avancé: 3,
    Expert: 4,
  }

  const count = levels[level as keyof typeof levels] || 2

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4].map((index) => (
        <span
          key={index}
          style={{
            fontSize: 10,
            color: index <= count ? ORANGE : 'rgba(128,128,128,0.24)',
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 10px)',
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            borderRadius: 10,
            background: 'rgba(12, 10, 8, 0.94)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#FFFFFF',
            fontSize: 11.5,
            whiteSpace: 'nowrap',
            zIndex: 30,
            pointerEvents: 'none',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}

function CompareModalPortal({
  children,
  isOpen,
}: {
  children: React.ReactNode
  isOpen: boolean
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let root = document.getElementById('tech-compare-portal') as HTMLElement | null
    let createdHere = false

    if (!root) {
      root = document.createElement('div')
      root.id = 'tech-compare-portal'
      document.body.appendChild(root)
      createdHere = true
    }

    const timer = window.setTimeout(() => {
      setPortalRoot(root)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      if (createdHere && root?.parentNode) {
        root.parentNode.removeChild(root)
      }
    }
  }, [])

  if (!portalRoot || !isOpen) {
    return null
  }

  return createPortal(children, portalRoot)
}

function TechItemComponent({
  item,
  theme,
  viewMode,
  onCompare,
  isSelected,
}: {
  item: TechItem
  theme: ReturnType<typeof getTokens>
  viewMode: ViewMode
  onCompare: (item: TechItem) => void
  isSelected: boolean
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  if (viewMode === 'compact') {
    return (
      <Tooltip
        text={t('techList.tooltip', {
          name: item.name,
          level: levelLabel(t, item.level),
          years: item.years || 2,
        })}
      >
        <button
          type="button"
          onClick={() => onCompare(item)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 38,
            padding: '0 14px',
            borderRadius: 999,
            border: `1px solid ${isSelected ? theme.accent : theme.itemBorder}`,
            background: isSelected ? `${theme.accent}14` : theme.itemBg,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {item.logo ? (
            <img
              src={item.logo}
              alt={item.name}
              style={{ width: 15, height: 15, objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: theme.subtleText,
              }}
            >
              {item.short}
            </span>
          )}

          <span
            style={{
              color: theme.text,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {item.name}
          </span>

          {item.trending && <span style={{ fontSize: 10 }}>🔥</span>}
        </button>
      </Tooltip>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onCompare(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 16px',
        borderRadius: 18,
        border: `1px solid ${
          isSelected ? theme.accent : hovered ? theme.borderStrong : theme.itemBorder
        }`,
        background: hovered ? theme.itemHover : theme.itemBg,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.24s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? theme.shadowSm : 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 12,
          background: theme.panel,
          border: `1px solid ${theme.itemBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.logo ? (
          <img src={item.logo} alt={item.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: theme.softText,
            }}
          >
            {item.short}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <strong
            style={{
              color: theme.text,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {item.name}
          </strong>

          {item.level && <Stars level={item.level} />}
          {item.isNew && <Badge text={t('techList.badges.new')} color="#22C55E" />}
          {item.trending && <Badge text={t('techList.badges.trending')} color="#F59E0B" />}
          {item.certified && <Badge text={t('techList.badges.certified')} color="#8B5CF6" />}
        </div>

        {viewMode === 'list' && item.description && (
          <div
            style={{
              marginBottom: 6,
              color: theme.softText,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            {item.description}
          </div>
        )}

        <div
          style={{
            color: theme.subtleText,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          {experienceLabel(t, item.years)}
        </div>

        {viewMode === 'list' && item.projects?.length ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 10,
            }}
          >
            {item.projects.slice(0, 3).map((project) => (
              <span
                key={project}
                style={{
                  minHeight: 24,
                  padding: '0 10px',
                  borderRadius: 999,
                  background: theme.accentSoft,
                  border: `1px solid ${theme.borderStrong}`,
                  color: theme.text,
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                {project}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {isSelected && (
        <div
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            boxShadow: '0 0 0 6px rgba(239,159,39,0.10)',
          }}
        >
          ✓
        </div>
      )}
    </button>
  )
}

function TechMarqueeItem({
  item,
  theme,
  onCompare,
  isSelected,
}: {
  item: TechItem
  theme: ReturnType<typeof getTokens>
  onCompare: (item: TechItem) => void
  isSelected: boolean
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onCompare(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 'clamp(236px, 28vw, 286px)',
        minHeight: 132,
        flex: '0 0 clamp(236px, 28vw, 286px)',
        padding: 18,
        borderRadius: 22,
        border: `1px solid ${
          isSelected ? theme.accent : hovered ? theme.borderStrong : theme.itemBorder
        }`,
        background: hovered
          ? theme.itemHover
          : `linear-gradient(180deg, rgba(255,255,255,0.06), transparent), ${theme.itemBg}`,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        boxShadow: hovered ? theme.shadowMd : theme.shadowSm,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.24s ease',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 15,
              background: theme.panel,
              border: `1px solid ${theme.itemBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {item.logo ? (
              <img src={item.logo} alt={item.name} style={{ width: 25, height: 25, objectFit: 'contain' }} />
            ) : (
              <span
                style={{
                  color: theme.text,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {item.short}
              </span>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                color: theme.text,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.name}
            </strong>

            <span
              style={{
                display: 'block',
                marginTop: 4,
                color: theme.subtleText,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              {experienceLabel(t, item.years)}
            </span>
          </div>
        </div>

        {isSelected && (
          <span
            style={{
              width: 24,
              height: 24,
              flexShrink: 0,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              boxShadow: '0 0 0 6px rgba(239,159,39,0.10)',
            }}
          >
            ✓
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          minHeight: 34,
          color: theme.softText,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.description || t('techList.fallback.description')}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.level && <Stars level={item.level} />}

          <span
            style={{
              color: theme.softText,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {levelLabel(t, item.level)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {item.trending && <Badge text={t('techList.badges.trendShort')} color="#F59E0B" />}
          {item.certified && <Badge text={t('techList.badges.certifiedShort')} color="#8B5CF6" />}
        </div>
      </div>
    </button>
  )
}

function TechCategoryMarquee({
  category,
  index,
  theme,
  sortBy,
  selectedForCompare,
  onCompare,
}: {
  category: TechCategory
  index: number
  theme: ReturnType<typeof getTokens>
  sortBy: SortBy
  selectedForCompare: TechItem | null
  onCompare: (item: TechItem) => void
}) {
  const { t } = useTranslation()
  const items = sortItems(category.items, sortBy)

  if (!items.length) {
    return null
  }

  const repeatedItems = [...items, ...items]
  const frame = getCategoryFrame(theme.dark)
  const animationName = index % 2 === 0 ? 'techMarqueeLeft' : 'techMarqueeRight'
  const duration = Math.max(28, items.length * 6)

  return (
    <article
      className="tech-marquee-lane"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 28,
        padding: '24px 0 26px',
        background: theme.cardBg,
        border: `1px solid ${frame.border}`,
        boxShadow: `${theme.shadowSm}, ${frame.outerGlow}`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: frame.softOverlay,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 24,
          right: 24,
          height: 1.5,
          background: frame.topLine,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -80,
          right: -90,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `${category.color}18`,
          filter: 'blur(54px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 24px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: theme.accent,
                boxShadow: `0 0 0 5px ${theme.accentSoft}`,
              }}
            />

            <span
              style={{
                color: theme.accent,
                fontFamily: '"Roboto", "Syne", sans-serif',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {t('techList.labels.category')}
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              color: theme.text,
              fontFamily: '"Fraunces", serif',
              fontSize: 'clamp(25px, 2.4vw, 36px)',
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
            }}
          >
            {category.title}
          </h3>

          <p
            style={{
              maxWidth: 620,
              margin: '8px 0 0',
              color: theme.softText,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13.5,
              lineHeight: 1.7,
            }}
          >
            {category.description}
          </p>
        </div>

        <span
          style={{
            minHeight: 32,
            padding: '0 13px',
            borderRadius: 999,
            background: theme.itemBg,
            border: `1px solid ${theme.itemBorder}`,
            color: theme.subtleText,
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {techCountLabel(t, items.length)}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          padding: '4px 0',
          maskImage:
            'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div
          className="tech-marquee-track"
          style={{
            display: 'flex',
            width: 'max-content',
            gap: 14,
            paddingLeft: 24,
            paddingRight: 24,
            animation: `${animationName} ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        >
          {repeatedItems.map((item, itemIndex) => (
            <TechMarqueeItem
              key={`${category.title}-${item.name}-${itemIndex}`}
              item={item}
              theme={theme}
              onCompare={onCompare}
              isSelected={selectedForCompare?.name === item.name}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function TechCategoryCard({
  category,
  theme,
  viewMode,
  sortBy,
  selectedForCompare,
  onCompare,
}: {
  category: TechCategory
  theme: ReturnType<typeof getTokens>
  viewMode: ViewMode
  sortBy: SortBy
  selectedForCompare: TechItem | null
  onCompare: (item: TechItem) => void
}) {
  const { t } = useTranslation()
  const items = sortItems(category.items, sortBy)
  const frame = getCategoryFrame(theme.dark)

  if (!items.length) {
    return null
  }

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        padding: viewMode === 'compact' ? 18 : 22,
        background: theme.cardBg,
        border: `1px solid ${frame.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = theme.dark ? `${category.color}30` : `${category.color}24`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = frame.border
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: frame.softOverlay,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 18,
          right: 18,
          height: 1.5,
          background: frame.topLine,
          opacity: 0.95,
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `${category.color}14`,
          filter: 'blur(32px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginBottom: viewMode === 'compact' ? 14 : 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: theme.accent,
                boxShadow: `0 0 0 3px ${theme.accentSoft}`,
                flexShrink: 0,
              }}
            />

            <h3
              style={{
                margin: 0,
                color: theme.text,
                fontFamily: '"Fraunces", serif',
                fontSize: viewMode === 'compact' ? 18 : 22,
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              {category.title}
            </h3>
          </div>

          <span
            style={{
              minHeight: 28,
              padding: '0 12px',
              borderRadius: 999,
              background: theme.itemBg,
              border: `1px solid ${theme.itemBorder}`,
              color: theme.subtleText,
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {techCountLabel(t, items.length)}
          </span>
        </div>

        {viewMode !== 'compact' && (
          <p
            style={{
              margin: 0,
              color: theme.softText,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13.5,
              lineHeight: 1.7,
            }}
          >
            {category.description}
          </p>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: viewMode === 'compact' ? 'flex' : 'grid',
          flexWrap: viewMode === 'compact' ? 'wrap' : undefined,
          gridTemplateColumns:
            viewMode === 'grid' ? 'repeat(auto-fill, minmax(240px, 1fr))' : '1fr',
          gap: 10,
        }}
      >
        {items.map((item) => (
          <TechItemComponent
            key={item.name}
            item={item}
            theme={theme}
            viewMode={viewMode}
            onCompare={onCompare}
            isSelected={selectedForCompare?.name === item.name}
          />
        ))}
      </div>
    </article>
  )
}

function CompareModal({
  items,
  onClose,
  theme,
  isOpen,
}: {
  items: TechItem[]
  onClose: () => void
  theme: ReturnType<typeof getTokens>
  isOpen: boolean
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || items.length === 0) {
    return null
  }

  return (
    <CompareModalPortal isOpen={isOpen}>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: theme.modalBackdrop,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(1080px, 100%)',
            maxHeight: '86vh',
            overflow: 'auto',
            borderRadius: 28,
            padding: 28,
            background: theme.surface2,
            border: `1px solid ${theme.borderStrong}`,
            boxShadow: theme.shadowLg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: '0 auto auto 0',
              width: '100%',
              height: 2.5,
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2}, transparent)`,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: theme.accent,
                    boxShadow: `0 0 0 6px rgba(239,159,39,0.10)`,
                  }}
                />

                <span
                  style={{
                    color: theme.accent,
                    fontFamily: '"Roboto", "Syne", sans-serif',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('techList.compare.kicker')}
                </span>
              </div>

              <h2
                style={{
                  margin: 0,
                  color: theme.text,
                  fontFamily: '"Roboto", "Syne", sans-serif',
                  fontSize: 'clamp(24px, 2.6vw, 34px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                }}
              >
                {t('techList.compare.titlePrefix')}{' '}
                <span style={{ color: theme.accent }}>{t('techList.compare.titleAccent')}</span>
              </h2>

              <p
                style={{
                  margin: '10px 0 0',
                  color: theme.softText,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 620,
                }}
              >
                {t('techList.compare.description')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: `1px solid ${theme.itemBorder}`,
                background: theme.itemBg,
                color: theme.text,
                cursor: 'pointer',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {items.slice(0, MAX_COMPARE).map((item) => (
              <div
                key={item.name}
                style={{
                  borderRadius: 22,
                  padding: 22,
                  background: theme.panelStrong,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.shadowSm,
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      margin: '0 auto 12px',
                      background: theme.itemBg,
                      border: `1px solid ${theme.itemBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.logo ? (
                      <img src={item.logo} alt={item.name} style={{ width: 34, height: 34, objectFit: 'contain' }} />
                    ) : (
                      <span
                        style={{
                          color: theme.text,
                          fontSize: 18,
                          fontWeight: 800,
                        }}
                      >
                        {item.short}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      color: theme.text,
                      fontFamily: '"Fraunces", serif',
                      fontSize: 26,
                      fontWeight: 400,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.name}
                  </h3>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    {item.level && <Stars level={item.level} />}
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: 16,
                    color: theme.softText,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13.5,
                    lineHeight: 1.7,
                  }}
                >
                  {item.description || t('techList.fallback.noDescription')}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {[
                    { label: t('techList.compare.rows.level'), value: levelLabel(t, item.level) },
                    { label: t('techList.compare.rows.experience'), value: compactExperienceLabel(t, item.years) },
                    {
                      label: t('techList.compare.rows.certified'),
                      value: item.certified ? t('techList.boolean.yes') : t('techList.boolean.no'),
                    },
                    {
                      label: t('techList.compare.rows.trending'),
                      value: item.trending ? t('techList.boolean.yes') : t('techList.boolean.no'),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: `1px solid ${theme.itemBorder}`,
                      }}
                    >
                      <span
                        style={{
                          color: theme.subtleText,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {row.label}
                      </span>

                      <span
                        style={{
                          color: theme.text,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12.5,
                          fontWeight: 700,
                          textAlign: 'right',
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {item.projects?.length ? (
                  <div>
                    <div
                      style={{
                        marginBottom: 8,
                        color: theme.subtleText,
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('techList.compare.projects')}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {item.projects.map((project) => (
                        <span
                          key={project}
                          style={{
                            minHeight: 28,
                            padding: '0 10px',
                            borderRadius: 999,
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: theme.itemBg,
                            border: `1px solid ${theme.itemBorder}`,
                            color: theme.text,
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          {project}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </CompareModalPortal>
  )
}

function StickyFilterBar({
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  totalCategories,
  totalTechnologies,
  visible,
  theme,
}: {
  viewMode: ViewMode
  setViewMode: (view: ViewMode) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  totalCategories: number
  totalTechnologies: number
  visible: boolean
  theme: ReturnType<typeof getTokens>
}) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        position: 'sticky',
        top: 12,
        zIndex: 90,
        padding: '0 clamp(24px, 4vw, 48px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '14px 18px',
          borderRadius: 24,
          border: `1px solid ${theme.stickyBorder}`,
          background: theme.stickyBg,
          boxShadow: theme.shadowSm,
          backdropFilter: 'blur(16px) saturate(1.06)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: theme.accent,
              boxShadow: `0 0 0 6px rgba(239,159,39,0.10)`,
            }}
          />

          <span
            style={{
              color: theme.accent,
              fontFamily: '"Roboto", "Syne", sans-serif',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {t('techList.kicker')}
          </span>

          <span
            style={{
              minHeight: 30,
              padding: '0 12px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              background: theme.itemBg,
              border: `1px solid ${theme.itemBorder}`,
              color: theme.softText,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {t('techList.summary', {
              categories: totalCategories,
              technologies: totalTechnologies,
            })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ViewSelector view={viewMode} setView={setViewMode} theme={theme} />
          <SortSelector sortBy={sortBy} setSortBy={setSortBy} theme={theme} />
        </div>
      </div>
    </div>
  )
}

export default function TechListe() {
  const { t } = useTranslation()
  const { dark } = useTheme()
  const theme = useMemo(() => getTokens(dark), [dark])

  const [viewMode, setViewMode] = useState<ViewMode>('marquee')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [selectedForCompare, setSelectedForCompare] = useState<TechItem | null>(null)
  const [compareItems, setCompareItems] = useState<TechItem[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [techOfTheDayIndex, setTechOfTheDayIndex] = useState(0)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [headVisible, setHeadVisible] = useState(false)

  const heroRef = useRef<HTMLDivElement | null>(null)
  const selectionTimeoutRef = useRef<number | null>(null)

  const localizedCategories = useMemo(() => localizeTechCategories(t), [t])

  const visibleCategories = useMemo(() => {
    return localizedCategories.filter((category) => !category.hidden)
  }, [localizedCategories])

  const totalTechnologies = useMemo(
    () => visibleCategories.reduce((total, category) => total + category.items.length, 0),
    [visibleCategories]
  )

  const totalCertified = useMemo(
    () =>
      visibleCategories
        .flatMap((category) => category.items)
        .filter((item) => item.certified).length,
    [visibleCategories]
  )

  const totalTrending = useMemo(
    () =>
      visibleCategories
        .flatMap((category) => category.items)
        .filter((item) => item.trending).length,
    [visibleCategories]
  )

  const allTechItems = useMemo(
    () => visibleCategories.flatMap((category) => category.items),
    [visibleCategories]
  )

  const techOfTheDay = allTechItems[techOfTheDayIndex % allTechItems.length] || null

  useEffect(() => {
    const timer = window.setTimeout(() => setHeadVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!allTechItems.length) {
      return
    }

    const timer = window.setTimeout(() => {
      setTechOfTheDayIndex(Math.floor(Math.random() * allTechItems.length))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [allTechItems])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-70px 0px 0px 0px',
      }
    )

    if (heroRef.current) {
      observer.observe(heroRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        window.clearTimeout(selectionTimeoutRef.current)
      }
    }
  }, [])

  const handleCompare = useCallback(
    (item: TechItem) => {
      if (selectedForCompare?.name === item.name) {
        setSelectedForCompare(null)

        if (selectionTimeoutRef.current) {
          window.clearTimeout(selectionTimeoutRef.current)
        }

        return
      }

      if (selectedForCompare && selectedForCompare.name !== item.name) {
        setCompareItems([selectedForCompare, item].slice(0, MAX_COMPARE))
        setShowCompareModal(true)
        setSelectedForCompare(null)

        if (selectionTimeoutRef.current) {
          window.clearTimeout(selectionTimeoutRef.current)
        }

        return
      }

      setSelectedForCompare(item)

      if (selectionTimeoutRef.current) {
        window.clearTimeout(selectionTimeoutRef.current)
      }

      selectionTimeoutRef.current = window.setTimeout(() => {
        setSelectedForCompare(null)
      }, 2500)
    },
    [selectedForCompare]
  )

  const currentMeta = useMemo(() => {
    return t('techList.meta.current', {
      view: t(`techList.viewModes.${viewMode}`),
      sort: t(`techList.sortValues.${sortBy}`),
    })
  }, [sortBy, t, viewMode])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Roboto:wght@700;800;900&family=Syne:wght@700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes techBlobFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(0, 12px, 0) scale(1.03);
          }
        }

        @keyframes techBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes techMarqueeLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes techMarqueeRight {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        .tech-marquee-lane:hover .tech-marquee-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .tech-marquee-track {
            animation: none !important;
            transform: none !important;
          }
        }

        @media (max-width: 900px) {
          .tech-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ position: 'relative', overflow: 'visible' }}>
        <StickyFilterBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalCategories={visibleCategories.length}
          totalTechnologies={totalTechnologies}
          visible={stickyVisible}
          theme={theme}
        />

        <section
          style={{
            position: 'relative',
            overflow: 'clip',
            padding: '120px 0 136px',
            background: theme.bg,
            color: theme.text,
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `${theme.orb1}, ${theme.orb2}, ${theme.orb3}, ${theme.bg}`,
            }}
          />

          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: theme.gridPattern,
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 28%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -220,
              left: -180,
              width: 620,
              height: 620,
              borderRadius: '50%',
              filter: 'blur(86px)',
              opacity: 0.5,
              background: `radial-gradient(circle, rgba(239,159,39,0.20), transparent 66%)`,
              animation: 'techBlobFloat 18s ease-in-out infinite alternate',
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: -260,
              right: -230,
              width: 740,
              height: 740,
              borderRadius: '50%',
              filter: 'blur(86px)',
              opacity: 0.5,
              background: `radial-gradient(circle, rgba(247,192,96,0.14), transparent 68%)`,
              animation: 'techBlobFloat 18s ease-in-out infinite alternate-reverse',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1320,
              margin: '0 auto',
              padding: '0 48px',
            }}
          >
            <div ref={heroRef} style={{ marginBottom: 26 }}>
              <header
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 34,
                  alignItems: 'end',
                  padding: '24px 24px 22px',
                  borderRadius: 26,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface1,
                  boxShadow: theme.shadowSm,
                  opacity: headVisible ? 1 : 0,
                  transform: headVisible ? 'translateY(0)' : 'translateY(-14px)',
                  transition:
                    'opacity 0.55s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1)',
                  backdropFilter: 'blur(16px) saturate(1.06)',
                  WebkitBackdropFilter: 'blur(16px) saturate(1.06)',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 16,
                      color: theme.accent,
                      fontFamily: '"Roboto", "Syne", sans-serif',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: theme.accent,
                        boxShadow: '0 0 0 6px rgba(239,159,39,0.10)',
                        animation: 'techBlink 2.4s ease-in-out infinite',
                      }}
                    />
                    {t('techList.kicker')}
                  </span>

                  <h2
                    style={{
                      margin: 0,
                      color: theme.text,
                      fontFamily: '"Roboto", "Syne", sans-serif',
                      fontSize: 'clamp(35px, 3.9vw, 62px)',
                      fontWeight: 800,
                      lineHeight: 1.04,
                      letterSpacing: '-0.045em',
                      textWrap: 'balance',
                      textShadow: '0 2px 18px rgba(0,0,0,0.08)',
                    }}
                  >
                    {t('techList.hero.titlePrefix')}{' '}
                    <em style={{ color: theme.accent, fontStyle: 'normal' }}>
                      {t('techList.hero.titleAccent')}
                    </em>
                    {t('techList.hero.titleSuffix')}
                  </h2>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      maxWidth: 620,
                      color: theme.softText,
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 15,
                      lineHeight: 1.76,
                      fontWeight: 400,
                    }}
                  >
                    {t('techList.hero.description')}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      t('techList.hero.pills.liquidGlass'),
                      t('techList.hero.pills.quickCompare'),
                      t('techList.hero.pills.premiumRead'),
                    ].map((pill) => (
                      <span
                        key={pill}
                        style={{
                          minHeight: 33,
                          padding: '0 14px',
                          borderRadius: 999,
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'rgba(239, 159, 39, 0.08)',
                          border: '1px solid rgba(239, 159, 39, 0.16)',
                          color: theme.accent,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginTop: 2 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          color: theme.subtleText,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('techList.meta.activePath')}
                      </span>

                      <span
                        style={{
                          color: theme.text,
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {currentMeta}
                      </span>
                    </div>

                    <div
                      style={{
                        position: 'relative',
                        height: 7,
                        borderRadius: 999,
                        overflow: 'hidden',
                        background: 'rgba(239, 159, 39, 0.10)',
                        border: '1px solid rgba(239, 159, 39, 0.10)',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width:
                            viewMode === 'grid'
                              ? '38%'
                              : viewMode === 'list'
                                ? '68%'
                                : viewMode === 'compact'
                                  ? '100%'
                                  : '86%',
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
                          boxShadow: '0 0 16px rgba(239,159,39,0.25)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </header>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 24,
              }}
            >
              {[
                { value: totalTechnologies, label: t('techList.stats.technologies') },
                { value: visibleCategories.length, label: t('techList.stats.categories') },
                { value: totalCertified, label: t('techList.stats.certified') },
                { value: totalTrending, label: t('techList.stats.trending') },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    borderRadius: 22,
                    padding: '18px 18px 16px',
                    background: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.shadowSm,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                  }}
                >
                  <div
                    style={{
                      color: theme.text,
                      fontFamily: '"Roboto", "Syne", sans-serif',
                      fontSize: 'clamp(34px, 3vw, 44px)',
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {stat.value}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: theme.subtleText,
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {techOfTheDay ? (
              <div
                style={{
                  marginBottom: 28,
                  padding: 20,
                  borderRadius: 24,
                  background: theme.cardBg,
                  border: `1px solid ${theme.borderStrong}`,
                  boxShadow: theme.shadowSm,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 18,
                  flexWrap: 'wrap',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: theme.accentSoft,
                      border: `1px solid ${theme.borderStrong}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    🌟
                  </div>

                  <div>
                    <div
                      style={{
                        marginBottom: 3,
                        color: theme.accent,
                        fontFamily: '"Roboto", "Syne", sans-serif',
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('techList.daily.kicker')}
                    </div>

                    <div
                      style={{
                        color: theme.text,
                        fontFamily: '"Fraunces", serif',
                        fontSize: 26,
                        fontWeight: 400,
                        lineHeight: 1.15,
                      }}
                    >
                      {techOfTheDay.name}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    maxWidth: 560,
                    color: theme.softText,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13.5,
                    lineHeight: 1.7,
                  }}
                >
                  {techOfTheDay.description || t('techList.daily.fallback')}
                </div>
              </div>
            ) : null}

            {viewMode === 'marquee' ? (
              <div style={{ display: 'grid', gap: 22 }}>
                {visibleCategories.map((category, index) => (
                  <TechCategoryMarquee
                    key={category.title}
                    category={category}
                    index={index}
                    theme={theme}
                    sortBy={sortBy}
                    selectedForCompare={selectedForCompare}
                    onCompare={handleCompare}
                  />
                ))}
              </div>
            ) : (
              <div
                className="tech-grid-responsive"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    viewMode === 'compact'
                      ? 'repeat(auto-fit, minmax(300px, 1fr))'
                      : 'repeat(2, minmax(0, 1fr))',
                  gap: 18,
                }}
              >
                {visibleCategories.map((category) => (
                  <div
                    key={category.title}
                    style={{
                      gridColumn:
                        category.size === 'wide' && viewMode !== 'compact' ? '1 / -1' : 'auto',
                    }}
                  >
                    <TechCategoryCard
                      category={category}
                      theme={theme}
                      viewMode={viewMode}
                      sortBy={sortBy}
                      selectedForCompare={selectedForCompare}
                      onCompare={handleCompare}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <CompareModal
        items={compareItems}
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false)
          setCompareItems([])
        }}
        theme={theme}
      />
    </>
  )
}
