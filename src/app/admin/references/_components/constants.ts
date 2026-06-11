import type { ReferenceStatus, SortField, VisibleColumns } from './types'
export { DEFAULT_EXCEL_SETTINGS, cloneDefaultExcelSettings } from '@/app/lib/referenceExcelSettings'

export const ORANGE = '#EF9F27'
export const ORANGE_DARK = '#c97d15'

export const STATUS_CFG: Record<ReferenceStatus, { label: string; color: string; bg: string; dot: string }> = {
  PUBLISHED: { label: 'Publié', color: '#1D9E75', bg: 'rgba(29,158,117,.12)', dot: '#1D9E75' },
  DRAFT: { label: 'Brouillon', color: '#f5a623', bg: 'rgba(245,166,35,.12)', dot: '#f5a623' },
  ARCHIVED: { label: 'Archivé', color: '#7c8799', bg: 'rgba(124,135,153,.14)', dot: '#7c8799' },
}

export const CATEGORIES = [
  'Transformation digitale',
  'IA & Data Science',
  'Smart Building',
  'Industrie 4.0',
  'Cybersécurité',
  'HealthTech & IA',
  'Smart City',
  'Luxe & Digital',
  'Fintech',
  'Robotique',
  'Supply Chain',
  'Logistique',
  'Énergie',
  'Fintech inclusive',
  'Cloud & DevOps',
]

export const SORT_LABELS: Record<SortField, string> = {
  title: 'Titre',
  client: 'Client',
  country: 'Pays',
  date: 'Année',
  category: 'Catégorie',
  status: 'Statut',
  createdAt: 'Date création',
}

export const LIMIT_OPTIONS = [10, 20, 50, 100]

export const VISIBLE_COLS_DEFAULT: VisibleColumns = {
  image: true,
  title: true,
  client: true,
  country: true,
  category: true,
  date: true,
  status: true,
  createdAt: false,
  actions: true,
}