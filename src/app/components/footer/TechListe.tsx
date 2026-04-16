'use client'

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@/app/context/ThemeContext'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type TechItem = {
  name: string
  short: string
  logo?: string
  level?: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert'
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

type ViewMode = 'grid' | 'list' | 'compact'
type SortBy = 'name' | 'level' | 'years' | 'trending'
type Language = 'fr' | 'en' | 'es'

/* -------------------------------------------------------------------------- */
/*                              HELPERS / UTILITIES                           */
/* -------------------------------------------------------------------------- */

const ORANGE = '#EF9F27'

function si(slug: string, color: string) {
  return `https://cdn.simpleicons.org/${slug}/${color.replace('#', '')}`
}

function getTokens(dark: boolean) {
  return {
    bg: dark ? '#0B0D11' : '#F7F8FA',
    panel: dark ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.72)',
    cardBg: dark ? 'rgba(255,255,255,.012)' : 'rgba(255,255,255,.48)',
    cardBorder: dark ? 'rgba(255,255,255,.02)' : 'rgba(15,23,42,.02)',
    itemBg: dark ? 'rgba(255,255,255,.008)' : 'rgba(15,23,42,.015)',
    itemBorder: dark ? 'rgba(255,255,255,.02)' : 'rgba(15,23,42,.025)',
    text: dark ? '#F5F7FA' : '#111827',
    softText: dark ? 'rgba(255,255,255,.68)' : 'rgba(17,24,39,.68)',
    subtleText: dark ? 'rgba(255,255,255,.42)' : 'rgba(17,24,39,.42)',
    orangeSoft: dark ? 'rgba(239,159,39,.08)' : 'rgba(239,159,39,.07)',
    orangeBorder: 'rgba(239,159,39,.12)',
    shadow: dark ? '0 4px 12px rgba(0,0,0,.08)' : '0 2px 8px rgba(15,23,42,.02)',
  }
}

// Traductions
const translations: Record<Language, any> = {
  fr: {
    stack: 'Stack technique',
    technologies: 'Technologies et outils maîtrisés',
    description: 'Une interface épurée, avec une hiérarchie claire, des catégories distinctes et des logos propres à chaque technologie.',
    poles: 'pôles',
    technologies_count: 'technologies',
    search: 'Rechercher une technologie...',
    view: 'Vue',
    sort: 'Trier par',
    level: 'Niveau',
    years: 'Années d\'exp.',
    name: 'Nom',
    trending: 'Tendance',
    export: 'Exporter',
    pdf: 'PDF',
    json: 'JSON',
    reset: 'Réinitialiser',
    show_hidden: 'Afficher cachées',
    compare: 'Comparer',
    tech_day: 'Technologie du jour',
    today_tip: 'Astuce du jour',
    close: 'Fermer',
    select_compare: 'Sélectionner à comparer',
    compare_with: 'Comparer avec',
    certifications: 'Certifications',
    projects: 'Projets clés',
    years_exp: 'années d\'expérience',
    new: 'Nouveau',
    trending_badge: 'Tendance',
    certified: 'Certifié',
    export_success: 'Export réussi !',
    print: 'Imprimer',
    customize: 'Personnaliser',
    categories: 'Catégories',
    hide: 'Cacher',
    show: 'Afficher',
    save_preferences: 'Sauvegarder préférences',
    preferences_saved: 'Préférences sauvegardées',
    no_results: 'Aucune technologie trouvée',
    level_beginner: 'Débutant',
    level_intermediate: 'Intermédiaire',
    level_advanced: 'Avancé',
    level_expert: 'Expert',
  },
  en: {
    stack: 'Tech Stack',
    technologies: 'Technologies and Tools Mastered',
    description: 'A clean interface with clear hierarchy, distinct categories, and proper logos for each technology.',
    poles: 'poles',
    technologies_count: 'technologies',
    search: 'Search for a technology...',
    view: 'View',
    sort: 'Sort by',
    level: 'Level',
    years: 'Years exp.',
    name: 'Name',
    trending: 'Trending',
    export: 'Export',
    pdf: 'PDF',
    json: 'JSON',
    reset: 'Reset',
    show_hidden: 'Show hidden',
    compare: 'Compare',
    tech_day: 'Technology of the day',
    today_tip: 'Today\'s tip',
    close: 'Close',
    select_compare: 'Select to compare',
    compare_with: 'Compare with',
    certifications: 'Certifications',
    projects: 'Key projects',
    years_exp: 'years of experience',
    new: 'New',
    trending_badge: 'Trending',
    certified: 'Certified',
    export_success: 'Export successful!',
    print: 'Print',
    customize: 'Customize',
    categories: 'Categories',
    hide: 'Hide',
    show: 'Show',
    save_preferences: 'Save preferences',
    preferences_saved: 'Preferences saved',
    no_results: 'No technologies found',
    level_beginner: 'Beginner',
    level_intermediate: 'Intermediate',
    level_advanced: 'Advanced',
    level_expert: 'Expert',
  },
  es: {
    stack: 'Stack técnica',
    technologies: 'Tecnologías y herramientas dominadas',
    description: 'Una interfaz limpia con jerarquía clara, categorías distintas y logotipos adecuados para cada tecnología.',
    poles: 'polos',
    technologies_count: 'tecnologías',
    search: 'Buscar tecnología...',
    view: 'Vista',
    sort: 'Ordenar por',
    level: 'Nivel',
    years: 'Años exp.',
    name: 'Nombre',
    trending: 'Tendencia',
    export: 'Exportar',
    pdf: 'PDF',
    json: 'JSON',
    reset: 'Reiniciar',
    show_hidden: 'Mostrar ocultas',
    compare: 'Comparar',
    tech_day: 'Tecnología del día',
    today_tip: 'Consejo del día',
    close: 'Cerrar',
    select_compare: 'Seleccionar para comparar',
    compare_with: 'Comparar con',
    certifications: 'Certificaciones',
    projects: 'Proyectos clave',
    years_exp: 'años de experiencia',
    new: 'Nuevo',
    trending_badge: 'Tendencia',
    certified: 'Certificado',
    export_success: '¡Exportación exitosa!',
    print: 'Imprimir',
    customize: 'Personalizar',
    categories: 'Categorías',
    hide: 'Ocultar',
    show: 'Mostrar',
    save_preferences: 'Guardar preferencias',
    preferences_saved: 'Preferencias guardadas',
    no_results: 'No se encontraron tecnologías',
    level_beginner: 'Principiante',
    level_intermediate: 'Intermedio',
    level_advanced: 'Avanzado',
    level_expert: 'Experto',
  },
}

// Données enrichies
const TECH_CATEGORIES: TechCategory[] = [
  {
    title: 'Frontend',
    description: 'Interfaces modernes, fluides et cohérentes.',
    color: '#38BDF8',
    size: 'normal',
    items: [
      { name: 'React', short: 'R', logo: si('react', '#61DAFB'), level: 'Expert', years: 5, description: 'Bibliothèque JavaScript pour construire des interfaces utilisateur', certified: true, trending: true, projects: ['Dashboard Analytics', 'E-commerce Platform'] },
      { name: 'Next.js', short: 'N', logo: si('nextdotjs', '#000000'), level: 'Avancé', years: 3, description: 'Framework React pour le rendu côté serveur', certified: false, trending: true, isNew: true, projects: ['Portfolio', 'Blog Platform'] },
      { name: 'TypeScript', short: 'TS', logo: si('typescript', '#3178C6'), level: 'Expert', years: 4, description: 'Superset typé de JavaScript', certified: true, trending: true, projects: ['All projects'] },
      { name: 'JavaScript', short: 'JS', logo: si('javascript', '#F7DF1E'), level: 'Expert', years: 6, description: 'Langage de programmation web', certified: true, trending: false, projects: ['Legacy Systems', 'Modern Apps'] },
      { name: 'Figma', short: 'Fg', logo: si('figma', '#F24E1E'), level: 'Intermédiaire', years: 2, description: 'Outil de design collaboratif', certified: false, trending: true, projects: ['UI/UX Designs'] },
      { name: 'Tailwind CSS', short: 'Tw', logo: si('tailwindcss', '#06B6D4'), level: 'Avancé', years: 3, description: 'Framework CSS utilitaire', certified: false, trending: true, projects: ['Modern Web Apps'] },
    ],
  },
  {
    title: 'Backend',
    description: 'Architecture, APIs, logique métier et intégrations.',
    color: '#10B981',
    size: 'wide',
    items: [
      { name: 'Node.js', short: 'Nd', logo: si('nodedotjs', '#5FA04E'), level: 'Avancé', years: 4, description: 'Runtime JavaScript côté serveur', certified: true, trending: true, projects: ['REST APIs', 'Microservices'] },
      { name: 'Java', short: 'Jv', logo: si('openjdk', '#ED8B00'), level: 'Expert', years: 7, description: 'Langage orienté objet robuste', certified: true, trending: false, projects: ['Enterprise Apps', 'Banking Systems'] },
      { name: 'Spring Boot', short: 'SB', logo: si('springboot', '#6DB33F'), level: 'Avancé', years: 4, description: 'Framework Java pour microservices', certified: true, trending: true, projects: ['Microservices Architecture'] },
      { name: 'C#', short: 'C#', logo: si('csharp', '#7C3AED'), level: 'Intermédiaire', years: 3, description: 'Langage moderne de Microsoft', certified: false, trending: false, projects: ['Desktop Apps'] },
      { name: '.NET', short: '.N', logo: si('dotnet', '#512BD4'), level: 'Intermédiaire', years: 3, description: 'Framework Microsoft', certified: false, trending: false, projects: ['Enterprise Solutions'] },
      { name: 'Express.js', short: 'Ex', logo: si('express', '#444444'), level: 'Avancé', years: 4, description: 'Framework Node.js minimaliste', certified: false, trending: true, projects: ['REST APIs', 'Backend Services'] },
      { name: 'ZK Framework', short: 'ZK', level: 'Intermédiaire', years: 2, description: 'Framework Java pour UI riches', certified: false, trending: false, projects: ['Enterprise Web Apps'] },
      { name: 'Laravel', short: 'Lv', logo: si('laravel', '#FF2D20'), level: 'Intermédiaire', years: 2, description: 'Framework PHP élégant', certified: false, trending: false, projects: ['Web Apps'] },
      { name: 'Python', short: 'Py', logo: si('python', '#3776AB'), level: 'Avancé', years: 5, description: 'Langage polyvalent', certified: true, trending: true, projects: ['Data Science', 'APIs', 'Automation'] },
    ],
  },
  {
    title: 'Bases de données',
    description: 'Stockage, cache, temps réel et performance.',
    color: '#8B5CF6',
    size: 'normal',
    items: [
      { name: 'PostgreSQL', short: 'Pg', logo: si('postgresql', '#4169E1'), level: 'Avancé', years: 4, description: 'Base de données relationnelle avancée', certified: true, trending: true, projects: ['Analytics DB', 'Production DB'] },
      { name: 'MySQL', short: 'My', logo: si('mysql', '#4479A1'), level: 'Expert', years: 6, description: 'Base de données populaire', certified: true, trending: false, projects: ['Legacy Systems', 'Web Apps'] },
      { name: 'MongoDB', short: 'Mg', logo: si('mongodb', '#47A248'), level: 'Avancé', years: 3, description: 'Base de données NoSQL', certified: false, trending: true, projects: ['Big Data', 'Real-time Apps'] },
      { name: 'Redis', short: 'Rd', logo: si('redis', '#DC382D'), level: 'Intermédiaire', years: 2, description: 'Cache et base de données en mémoire', certified: false, trending: true, projects: ['Caching Layer', 'Session Management'] },
      { name: 'Firebase', short: 'Fb', logo: si('firebase', '#FFCA28'), level: 'Intermédiaire', years: 2, description: 'Plateforme BaaS de Google', certified: false, trending: true, projects: ['Real-time Apps', 'Mobile Backend'] },
    ],
  },
  {
    title: 'DevOps & Cloud',
    description: 'Déploiement, orchestration, serveurs et delivery.',
    color: '#F59E0B',
    size: 'wide',
    items: [
      { name: 'Docker', short: 'Dc', logo: si('docker', '#2496ED'), level: 'Avancé', years: 4, description: 'Conteneurisation d\'applications', certified: true, trending: true, projects: ['Microservices', 'CI/CD Pipeline'] },
      { name: 'Kubernetes', short: 'K8', logo: si('kubernetes', '#326CE5'), level: 'Intermédiaire', years: 2, description: 'Orchestration de conteneurs', certified: false, trending: true, isNew: true, projects: ['Cloud Infrastructure'] },
      { name: 'AWS', short: 'AWS', logo: si('amazonwebservices', '#FF9900'), level: 'Avancé', years: 3, description: 'Cloud computing Amazon', certified: true, trending: true, projects: ['Cloud Migration', 'Serverless'] },
      { name: 'Azure', short: 'Az', logo: si('microsoftazure', '#0078D4'), level: 'Intermédiaire', years: 2, description: 'Cloud Microsoft', certified: false, trending: false, projects: ['Enterprise Cloud'] },
      { name: 'Git / CI-CD', short: 'Git', logo: si('git', '#F05032'), level: 'Expert', years: 6, description: 'Contrôle de version et intégration continue', certified: true, trending: true, projects: ['All projects'] },
      { name: 'SVN', short: 'SVN', logo: si('subversion', '#809CC9'), level: 'Avancé', years: 4, description: 'Système de contrôle de version', certified: false, trending: false, projects: ['Legacy Projects'] },
      { name: 'Nginx', short: 'Nx', logo: si('nginx', '#009639'), level: 'Avancé', years: 3, description: 'Serveur web et reverse proxy', certified: false, trending: true, projects: ['Web Servers', 'Load Balancing'] },
      { name: 'Tomcat', short: 'Tc', logo: si('apachetomcat', '#F8DC75'), level: 'Avancé', years: 4, description: 'Serveur d\'applications Java', certified: false, trending: false, projects: ['Java EE Apps'] },
    ],
  },
  {
    title: 'Monitoring & Observabilité',
    description: 'Métriques, logs, alertes et visualisation.',
    color: '#EF4444',
    size: 'normal',
    items: [
      { name: 'Kibana', short: 'Kb', logo: si('kibana', '#005571'), level: 'Intermédiaire', years: 2, description: 'Visualisation de données Elasticsearch', certified: false, trending: false, projects: ['Log Analysis'] },
      { name: 'Elasticsearch', short: 'Es', logo: si('elasticsearch', '#005571'), level: 'Intermédiaire', years: 2, description: 'Moteur de recherche et d\'analyse', certified: false, trending: true, projects: ['Search Engine', 'Log Analytics'] },
      { name: 'Prometheus', short: 'Pr', logo: si('prometheus', '#E6522C'), level: 'Débutant', years: 1, description: 'Monitoring et alerting', certified: false, trending: true, isNew: true, projects: ['Metrics Collection'] },
      { name: 'Grafana', short: 'Gr', logo: si('grafana', '#F46800'), level: 'Intermédiaire', years: 2, description: 'Visualisation de métriques', certified: false, trending: true, projects: ['Dashboards', 'Analytics'] },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                              COMPOSANTS D'UI                               */
/* -------------------------------------------------------------------------- */

// Composant de recherche
const SearchBar = ({ value, onChange, theme, language }: any) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <input
      type="text"
      placeholder={translations[language].search}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: 999,
        border: `1px solid ${theme.cardBorder}`,
        background: theme.panel,
        color: theme.text,
        fontSize: 14,
        outline: 'none',
        transition: 'all 0.2s',
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = ORANGE}
      onBlur={(e) => e.currentTarget.style.borderColor = theme.cardBorder}
    />
  </div>
)

// Composant de sélecteur de vue
const ViewSelector = ({ view, setView, theme, language }: any) => (
  <div style={{ display: 'flex', gap: 8, background: theme.panel, padding: 4, borderRadius: 999, border: `1px solid ${theme.cardBorder}` }}>
    {['grid', 'list', 'compact'].map((v) => (
      <button
        key={v}
        onClick={() => setView(v)}
        style={{
          padding: '8px 16px',
          borderRadius: 999,
          background: view === v ? ORANGE : 'transparent',
          color: view === v ? '#fff' : theme.softText,
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.2s',
        }}
      >
        {translations[language][v] || v}
      </button>
    ))}
  </div>
)

// Composant de tri
const SortSelector = ({ sortBy, setSortBy, theme, language }: any) => (
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    style={{
      padding: '8px 16px',
      borderRadius: 999,
      border: `1px solid ${theme.cardBorder}`,
      background: theme.panel,
      color: theme.text,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      outline: 'none',
    }}
  >
    <option value="name">{translations[language].name}</option>
    <option value="level">{translations[language].level}</option>
    <option value="years">{translations[language].years}</option>
    <option value="trending">{translations[language].trending}</option>
  </select>
)

// Composant de badge
const Badge = ({ text, color, bgColor }: any) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 999,
    background: bgColor || `${color}10`,
    color: color,
    fontSize: 10,
    fontWeight: 700,
    gap: 4,
  }}>
    {text}
  </span>
)

// Composant d'évaluation par étoiles
const Stars = ({ level }: { level: string }) => {
  const levels = { 'Débutant': 1, 'Intermédiaire': 2, 'Avancé': 3, 'Expert': 4, 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 }
  const count = levels[level as keyof typeof levels] || 2
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} style={{ color: i <= count ? ORANGE : '#ccc', fontSize: 12 }}>★</span>
      ))}
    </div>
  )
}

// Composant Tooltip
const Tooltip = ({ children, text }: any) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          padding: '6px 10px',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 12,
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 1000,
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

// Composant de techno individuelle (différents modes d'affichage)
const TechItemComponent = ({ item, color, theme, dark, viewMode, language, onCompare, isSelected }: any) => {
  const levelColors = {
    'Débutant': '#94A3B8', 'Intermédiaire': '#60A5FA', 'Avancé': '#34D399', 'Expert': '#FBBF24',
    'Beginner': '#94A3B8', 'Intermediate': '#60A5FA', 'Advanced': '#34D399', 'Expert': '#FBBF24'
  }

  if (viewMode === 'compact') {
    return (
      <Tooltip text={`${item.name} - ${item.level || 'Intermédiaire'} • ${item.years || 2}+ ${translations[language].years_exp}`}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 999,
          background: theme.itemBg,
          border: `1px solid ${theme.itemBorder}`,
        }}>
          <span style={{ fontSize: 12 }}>{item.short}</span>
          {item.trending && <span style={{ fontSize: 8 }}>🔥</span>}
        </div>
      </Tooltip>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 16,
      background: theme.itemBg,
      border: `1px solid ${theme.itemBorder}`,
      transition: 'all 0.2s',
      cursor: 'pointer',
    }} onClick={() => onCompare?.(item)}>
      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.logo ? (
          <img src={item.logo} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 700 }}>{item.short}</span>
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <strong style={{ fontSize: 15, color: theme.text }}>{item.name}</strong>
          {item.level && <Stars level={item.level} />}
          {item.isNew && <Badge text={translations[language].new} color="#10B981" />}
          {item.trending && <Badge text={translations[language].trending_badge} color="#F59E0B" />}
          {item.certified && <Badge text={translations[language].certified} color="#8B5CF6" />}
        </div>
        {viewMode === 'list' && item.description && (
          <div style={{ fontSize: 12, color: theme.softText, marginBottom: 4 }}>{item.description}</div>
        )}
        {item.years && (
          <div style={{ fontSize: 11, color: theme.subtleText }}>{item.years}+ {translations[language].years_exp}</div>
        )}
      </div>
      
      {isSelected && (
        <div style={{ width: 20, height: 20, borderRadius: 10, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>✓</div>
      )}
    </div>
  )
}

// Composant de catégorie
const TechCategoryCard = ({ category, theme, dark, viewMode, language, searchTerm, sortBy, selectedForCompare, onCompare }: any) => {
  let items = [...category.items]
  
  // Filtrage
  if (searchTerm) {
    items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }
  
  // Tri
  if (sortBy === 'level') {
    const levelOrder = { 'Expert': 4, 'Avancé': 3, 'Intermédiaire': 2, 'Débutant': 1, 'Advanced': 3, 'Intermediate': 2, 'Beginner': 1 }
    items.sort((a, b) => (levelOrder[b.level as keyof typeof levelOrder] || 0) - (levelOrder[a.level as keyof typeof levelOrder] || 0))
  } else if (sortBy === 'years') {
    items.sort((a, b) => (b.years || 0) - (a.years || 0))
  } else if (sortBy === 'trending') {
    items.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0))
  }
  
  if (items.length === 0) return null
  
  return (
    <article style={{
      borderRadius: 28,
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      padding: viewMode === 'compact' ? 16 : 24,
      transition: 'all 0.25s ease',
    }}>
      <div style={{ marginBottom: viewMode === 'compact' ? 12 : 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: category.color }} />
            <h3 style={{ margin: 0, color: theme.text, fontSize: viewMode === 'compact' ? 16 : 17, fontWeight: 700 }}>{category.title}</h3>
          </div>
          <span style={{ fontSize: 12, color: theme.subtleText }}>{items.length} techno{items.length > 1 ? 's' : ''}</span>
        </div>
        {viewMode !== 'compact' && (
          <p style={{ margin: 0, color: theme.softText, fontSize: 13.2 }}>{category.description}</p>
        )}
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {items.map((item) => (
          <TechItemComponent
            key={item.name}
            item={item}
            color={category.color}
            theme={theme}
            dark={dark}
            viewMode={viewMode}
            language={language}
            onCompare={onCompare}
            isSelected={selectedForCompare?.name === item.name}
          />
        ))}
      </div>
    </article>
  )
}

// Composant de comparaison
const CompareModal = ({ items, onClose, theme, language }: any) => {
  if (items.length === 0) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: theme.bg,
        borderRadius: 28,
        padding: 32,
        maxWidth: 900,
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: theme.text }}>{translations[language].compare_with}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.text }}>×</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 20 }}>
          {items.map((item: TechItem) => (
            <div key={item.name} style={{ padding: 20, borderRadius: 16, background: theme.panel, border: `1px solid ${theme.cardBorder}` }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                {item.logo ? (
                  <img src={item.logo} alt={item.name} style={{ width: 48, height: 48, marginBottom: 12 }} />
                ) : (
                  <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{item.short}</div>
                )}
                <h3 style={{ margin: 0, color: theme.text }}>{item.name}</h3>
              </div>
              <div style={{ fontSize: 13, color: theme.softText, marginBottom: 16 }}>{item.description || 'Aucune description'}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>{translations[language].level}:</strong> {item.level || 'Intermédiaire'}</div>
                <div><strong>{translations[language].years}:</strong> {item.years || 2}+ {translations[language].years_exp}</div>
                {item.certified && <div><strong>{translations[language].certifications}:</strong> ✓</div>}
                {item.projects && (
                  <div><strong>{translations[language].projects}:</strong> {item.projects.join(', ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Composant de personnalisation
const CustomizeModal = ({ hiddenCategories, setHiddenCategories, categories, onClose, theme, language, onSave }: any) => {
  const [tempHidden, setTempHidden] = useState(hiddenCategories)
  
  const handleSave = () => {
    setHiddenCategories(tempHidden)
    onSave()
    onClose()
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: theme.bg,
        borderRadius: 28,
        padding: 32,
        maxWidth: 500,
        width: '100%',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: theme.text }}>{translations[language].customize}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.text }}>×</button>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>{translations[language].categories}</h3>
          {categories.map((cat: TechCategory) => (
            <label key={cat.title} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!tempHidden.includes(cat.title)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTempHidden(tempHidden.filter(h => h !== cat.title))
                  } else {
                    setTempHidden([...tempHidden, cat.title])
                  }
                }}
              />
              <span style={{ color: theme.text }}>{cat.title}</span>
            </label>
          ))}
        </div>
        
        <button onClick={handleSave} style={{
          width: '100%',
          padding: '12px',
          borderRadius: 999,
          background: ORANGE,
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          {translations[language].save_preferences}
        </button>
      </div>
    </div>
  )
}

// Composant principal
export default function TechListe() {
  const { dark } = useTheme()
  const theme = useMemo(() => getTokens(dark), [dark])
  
  // États pour toutes les fonctionnalités
  const [language, setLanguage] = useState<Language>('fr')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<TechItem | null>(null)
  const [compareItems, setCompareItems] = useState<TechItem[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [techOfTheDay, setTechOfTheDay] = useState<TechItem | null>(null)
  
  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('tech_preferences')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      if (prefs.hiddenCategories) setHiddenCategories(prefs.hiddenCategories)
      if (prefs.language) setLanguage(prefs.language)
      if (prefs.viewMode) setViewMode(prefs.viewMode)
    }
    
    // Sélectionner une technologie aléatoire du jour
    const allTechs = TECH_CATEGORIES.flatMap(cat => cat.items)
    const randomTech = allTechs[Math.floor(Math.random() * allTechs.length)]
    setTechOfTheDay(randomTech)
  }, [])
  
  // Sauvegarder les préférences
  const savePreferences = useCallback(() => {
    localStorage.setItem('tech_preferences', JSON.stringify({
      hiddenCategories,
      language,
      viewMode,
    }))
    alert(translations[language].preferences_saved)
  }, [hiddenCategories, language, viewMode])
  
  // Exporter en JSON
  const exportJSON = useCallback(() => {
    const data = TECH_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({ name: item.name, level: item.level, years: item.years }))
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tech-stack.json'
    a.click()
    URL.revokeObjectURL(url)
    alert(translations[language].export_success)
  }, [language])
  
  // Exporter en PDF (version simplifiée)
  const exportPDF = useCallback(() => {
    window.print()
  }, [])
  
  // Gérer la comparaison
  const handleCompare = useCallback((item: TechItem) => {
    if (selectedForCompare && selectedForCompare.name !== item.name) {
      setCompareItems([selectedForCompare, item])
      setShowCompareModal(true)
      setSelectedForCompare(null)
    } else {
      setSelectedForCompare(item)
      setTimeout(() => setSelectedForCompare(null), 2000)
    }
  }, [selectedForCompare])
  
  // Filtrer les catégories visibles
  const visibleCategories = TECH_CATEGORIES.filter(cat => 
    showHidden || !hiddenCategories.includes(cat.title)
  )
  
  // Calculer le total des technologies visibles
  const totalTechnologies = useMemo(() => {
    return visibleCategories.reduce((total, category) => total + category.items.length, 0)
  }, [visibleCategories])
  
  const t = translations[language]
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          * { color: black !important; }
        }
      `}</style>
      
      <section style={{
        background: theme.bg,
        padding: 'clamp(56px, 8vw, 96px) clamp(18px, 4vw, 32px)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          
          {/* En-tête */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: theme.orangeSoft, border: `1px solid ${theme.orangeBorder}`, marginBottom: 16 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE }} />
                  <span style={{ color: ORANGE, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.stack}</span>
                </div>
                <h2 style={{ margin: 0, color: theme.text, fontSize: 'clamp(2rem, 4vw, 3.15rem)', lineHeight: 1.04, fontWeight: 800, maxWidth: 860 }}>{t.technologies}</h2>
                <p style={{ margin: '16px 0 0', color: theme.softText, fontSize: 'clamp(.98rem, 1.35vw, 1.05rem)', maxWidth: 760 }}>{t.description}</p>
              </div>
              
              {/* Contrôles de langue et export */}
              <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} style={{ padding: '8px 12px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}`, color: theme.text, cursor: 'pointer' }}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
                <button onClick={exportJSON} style={{ padding: '8px 16px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}`, color: theme.text, cursor: 'pointer' }}>{t.json}</button>
                <button onClick={exportPDF} style={{ padding: '8px 16px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}`, color: theme.text, cursor: 'pointer' }}>{t.pdf}</button>
                <button onClick={() => setShowCustomizeModal(true)} style={{ padding: '8px 16px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}`, color: theme.text, cursor: 'pointer' }}>{t.customize}</button>
              </div>
            </div>
            
            {/* Stats et recherche */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.subtleText }}>{visibleCategories.length} {t.poles} • {totalTechnologies} {t.technologies_count}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                <SearchBar value={searchTerm} onChange={setSearchTerm} theme={theme} language={language} />
                <ViewSelector view={viewMode} setView={setViewMode} theme={theme} language={language} />
                <SortSelector sortBy={sortBy} setSortBy={setSortBy} theme={theme} language={language} />
                <button onClick={() => setShowHidden(!showHidden)} style={{ padding: '8px 16px', borderRadius: 999, background: showHidden ? ORANGE : theme.panel, border: `1px solid ${theme.cardBorder}`, color: showHidden ? '#fff' : theme.text, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t.show_hidden}</button>
                <button onClick={savePreferences} style={{ padding: '8px 16px', borderRadius: 999, background: theme.panel, border: `1px solid ${theme.cardBorder}`, color: theme.text, cursor: 'pointer', fontSize: 13 }}>💾</button>
              </div>
            </div>
          </div>
          
          {/* Technologie du jour */}
          {techOfTheDay && (
            <div style={{ marginBottom: 32, padding: 16, borderRadius: 20, background: theme.orangeSoft, border: `1px solid ${theme.orangeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🌟</span>
                <div>
                  <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>{t.tech_day}</div>
                  <div style={{ fontWeight: 700, color: theme.text }}>{techOfTheDay.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: theme.softText }}>{techOfTheDay.description || t.today_tip}</div>
            </div>
          )}
          
          {/* Grille principale */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'compact' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'repeat(2, minmax(0, 1fr))',
            gap: viewMode === 'compact' ? 12 : 16,
          }}>
            {visibleCategories.map((category) => (
              <div key={category.title} style={{ gridColumn: category.size === 'wide' && viewMode !== 'compact' ? '1 / -1' : 'auto' }}>
                <TechCategoryCard
                  category={category}
                  theme={theme}
                  dark={dark}
                  viewMode={viewMode}
                  language={language}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                  selectedForCompare={selectedForCompare}
                  onCompare={handleCompare}
                />
              </div>
            ))}
          </div>
          
          {visibleCategories.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: theme.softText }}>{t.no_results}</div>
          )}
        </div>
      </section>
      
      {/* Modales */}
      {showCompareModal && (
        <CompareModal items={compareItems} onClose={() => { setShowCompareModal(false); setCompareItems([]) }} theme={theme} language={language} />
      )}
      
      {showCustomizeModal && (
        <CustomizeModal
          hiddenCategories={hiddenCategories}
          setHiddenCategories={setHiddenCategories}
          categories={TECH_CATEGORIES}
          onClose={() => setShowCustomizeModal(false)}
          theme={theme}
          language={language}
          onSave={savePreferences}
        />
      )}
    </>
  )
}