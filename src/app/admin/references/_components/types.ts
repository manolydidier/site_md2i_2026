export type ReferenceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type SortField =
  | 'title'
  | 'client'
  | 'country'
  | 'date'
  | 'category'
  | 'status'
  | 'createdAt'

export type SortDir = 'asc' | 'desc'
export type ExportKind = 'prompt' | 'selection'

export interface Reference {
  id: string
  country: string
  code: string
  lat: number
  lng: number
  title: string
  slug: string
  excerpt: string
  image: string
  details: string
  date: string
  client: string
  category: string
  tags: string[]
  impact: string | null
  technologies: string[]
  team: string | null
  duration: string | null
  budget: string | null
  status: ReferenceStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface OfferPreviewReference {
  id: string
  title: string
  client: string
  country: string
  date: string
  category: string
  technologies: string[]
  tags: string[]
  excerpt: string
  impact: string | null
  duration: string | null
  budget: string | null
  matchScore: number
  relevance: number
  matchedTerms: string[]
}

export type VisibleColumns = {
  image: boolean
  title: boolean
  client: boolean
  country: boolean
  category: boolean
  date: boolean
  status: boolean
  createdAt: boolean
  actions: boolean
}

export type {
  ExcelAlign,
  ExcelExportSettings,
  ReferenceExcelColumnKey,
  ReferenceExcelColumnSetting,
} from '@/app/lib/referenceExcelSettings'