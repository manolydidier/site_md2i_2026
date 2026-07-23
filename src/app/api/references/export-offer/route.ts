import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'
import {
  mergeExcelSettings,
  toArgb,
  type ExcelExportSettings,
  type ReferenceExcelColumnKey,
  type ReferenceExcelColumnSetting,
} from '@/app/lib/referenceExcelSettings'

export const runtime = 'nodejs'

type ExportMode = 'preview' | 'prompt' | 'selection'

type ReferenceForOffer = {
  id: string
  country: string
  code: string
  lat: number | null
  lng: number | null
  title: string
  slug: string
  excerpt: string
  image: string
  details: string
  date: string
  client: string
  category: string
  tags: string[]
  technologies: string[]
  impact: string | null
  team: string | null
  duration: string | null
  budget: string | null
  status: string
  publishedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

type MatchedReference = ReferenceForOffer & {
  matchScore: number
  relevance: number
  matchedTerms: string[]
}

type SearchProfile = {
  prompt: string
  normalizedPrompt: string
  originalTerms: Set<string>
  expandedTerms: Set<string>
  detectedDomains: string[]
}

const STOP_WORDS = new Set([
  'a', 'au', 'aux', 'avec', 'ce', 'ces', 'cette', 'dans', 'de', 'des', 'du',
  'en', 'et', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'pour', 'par', 'sur',
  'tout', 'tous', 'toutes', 'qui', 'que', 'quoi', 'dont', 'offre', 'besoin',
  'service', 'services', 'projet', 'projets',
])

const DOMAIN_LEXICON = [
  {
    name: 'Création de logiciel',
    triggers: ['logiciel', 'logiciels', 'software', 'application', 'applications', 'app', 'programme', 'progiciel', 'saas', 'plateforme', 'creation logiciel', 'creaction logiciel', 'création logiciel', 'developpement logiciel', 'développement logiciel', 'developpement application', 'développement application'],
    related: ['logiciel', 'application', 'web', 'mobile', 'plateforme', 'systeme', 'système', 'developpement', 'développement', 'api', 'base donnees', 'base données', 'database', 'interface', 'backend', 'frontend', 'typescript', 'javascript', 'react', 'next', 'node', 'prisma', 'postgres', 'sql', 'saas', 'erp', 'crm', 'automatisation', 'workflow', 'dashboard'],
  },
  {
    name: 'Digitalisation',
    triggers: ['digital', 'digitale', 'digitalisation', 'numerique', 'numérique', 'transformation digitale', 'dematerialisation', 'dématérialisation', 'modernisation'],
    related: ['digital', 'digitale', 'digitalisation', 'numerique', 'numérique', 'informatique', 'dematerialisation', 'dématérialisation', 'automatisation', 'workflow', 'plateforme', 'application', 'logiciel', 'data', 'cloud', 'processus', 'transformation'],
  },
  {
    name: 'Paie RH',
    triggers: ['paie', 'salaire', 'salaires', 'bulletin', 'bulletins', 'ressources humaines', 'rh', 'gestion personnel', 'fiche de paie'],
    related: ['paie', 'salaire', 'salaires', 'rh', 'ressources humaines', 'bulletin', 'bulletins', 'fiche de paie', 'declaration', 'déclaration', 'employe', 'employé', 'employes', 'employés', 'personnel', 'contrat', 'absence', 'conge', 'congé', 'cotisation', 'grh', 'sirh'],
  },
  {
    name: 'Data IA',
    triggers: ['data', 'donnee', 'donnée', 'donnees', 'données', 'ia', 'ai', 'intelligence artificielle', 'machine learning', 'deep learning', 'analyse donnees', 'analyse données', 'tableau de bord', 'dashboard', 'bi'],
    related: ['data', 'donnee', 'donnée', 'donnees', 'données', 'ia', 'ai', 'intelligence artificielle', 'machine learning', 'deep learning', 'analyse', 'prediction', 'prédiction', 'modele', 'modèle', 'dashboard', 'tableau de bord', 'bi', 'power bi', 'python', 'sql', 'etl', 'reporting', 'statistique'],
  },
  {
    name: 'SIG Cartographie',
    triggers: ['sig', 'gis', 'cartographie', 'geographique', 'géographique', 'geospatial', 'géospatial', 'localisation', 'map', 'carte', 'cartes'],
    related: ['sig', 'gis', 'cartographie', 'carte', 'cartes', 'geographique', 'géographique', 'geospatial', 'géospatial', 'localisation', 'gps', 'qgis', 'arcgis', 'map', 'mapping', 'territoire', 'spatial'],
  },
  {
    name: 'Cloud DevOps',
    triggers: ['cloud', 'devops', 'hebergement', 'hébergement', 'serveur', 'infrastructure', 'docker', 'kubernetes', 'ci cd', 'cicd'],
    related: ['cloud', 'devops', 'serveur', 'hebergement', 'hébergement', 'infrastructure', 'docker', 'kubernetes', 'ci', 'cd', 'cicd', 'pipeline', 'deployment', 'déploiement', 'deploiement', 'aws', 'azure', 'gcp', 'linux', 'monitoring'],
  },
  {
    name: 'Cybersécurité',
    triggers: ['cybersecurite', 'cybersécurité', 'cyber', 'securite informatique', 'sécurité informatique', 'audit securite', 'audit sécurité', 'protection donnees', 'protection données', 'rgpd'],
    related: ['cybersecurite', 'cybersécurité', 'cyber', 'securite', 'sécurité', 'audit', 'vulnerabilite', 'vulnérabilité', 'protection', 'donnees', 'données', 'rgpd', 'authentification', 'autorisation', 'sauvegarde', 'chiffrement', 'firewall', 'pentest'],
  },
  {
    name: 'Application mobile',
    triggers: ['mobile', 'android', 'ios', 'smartphone', 'application mobile', 'app mobile'],
    related: ['mobile', 'android', 'ios', 'smartphone', 'application', 'app', 'react native', 'flutter', 'offline', 'notification', 'push'],
  },
  {
    name: 'Site web',
    triggers: ['site web', 'website', 'web', 'vitrine', 'ecommerce', 'e-commerce', 'landing page', 'cms'],
    related: ['site web', 'website', 'web', 'vitrine', 'ecommerce', 'e-commerce', 'cms', 'seo', 'landing page', 'frontend', 'backend', 'next', 'react', 'wordpress'],
  },
]

const SEARCH_FIELDS: { key: keyof ReferenceForOffer; weight: number }[] = [
  { key: 'title', weight: 10 },
  { key: 'category', weight: 9 },
  { key: 'tags', weight: 8 },
  { key: 'technologies', weight: 8 },
  { key: 'excerpt', weight: 5 },
  { key: 'details', weight: 4 },
  { key: 'impact', weight: 4 },
  { key: 'team', weight: 3 },
  { key: 'client', weight: 2 },
  { key: 'country', weight: 1 },
  { key: 'date', weight: 1 },
  { key: 'duration', weight: 1 },
  { key: 'budget', weight: 1 },
  { key: 'status', weight: 1 },
]

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value: unknown) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanText(value: unknown) {
  return stripHtml(value).replace(/\s+/g, ' ').trim()
}

function slugify(value: unknown) {
  const slug = normalize(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
  return slug || 'offre'
}

function tokenizePrompt(prompt: string) {
  return normalize(prompt)
    .split(' ')
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .filter((term) => !STOP_WORDS.has(term))
}

function getTermVariants(term: string) {
  const normalized = normalize(term)
  const variants = new Set<string>()
  if (!normalized) return []
  variants.add(normalized)
  if (normalized.endsWith('s') && normalized.length > 3) variants.add(normalized.slice(0, -1))
  else if (normalized.length > 3) variants.add(`${normalized}s`)
  return [...variants]
}

function containsTerm(haystack: string, term: string) {
  const variants = getTermVariants(term)
  return variants.some((variant) => {
    if (variant.includes(' ')) return haystack.includes(variant)
    return new RegExp(`(^|\\s)${variant}(\\s|$)`, 'i').test(haystack)
  })
}

function buildSearchProfile(prompt: string): SearchProfile {
  const normalizedPrompt = normalize(prompt)
  const originalTerms = new Set(tokenizePrompt(prompt))
  const expandedTerms = new Set(originalTerms)
  const detectedDomains: string[] = []

  for (const domain of DOMAIN_LEXICON) {
    const domainMatched = domain.triggers.some((trigger) => containsTerm(normalizedPrompt, trigger))
    if (domainMatched) {
      detectedDomains.push(domain.name)
      for (const trigger of domain.triggers) expandedTerms.add(normalize(trigger))
      for (const related of domain.related) expandedTerms.add(normalize(related))
    }
  }

  return { prompt, normalizedPrompt, originalTerms, expandedTerms, detectedDomains }
}

function valueToSearchText(value: unknown) {
  if (Array.isArray(value)) return normalize(value.join(' '))
  return normalize(stripHtml(value))
}

function scoreToRelevance(score: number) {
  if (score <= 0) return 0
  return Math.max(25, Math.min(99, Math.round((score / 85) * 100)))
}

function scoreReference(reference: ReferenceForOffer, profile: SearchProfile) {
  let score = 0
  const matchedTerms = new Set<string>()
  const matchedOriginalTerms = new Set<string>()

  for (const term of profile.expandedTerms) {
    if (!term || term.length < 2) continue

    for (const field of SEARCH_FIELDS) {
      const fieldValue = valueToSearchText(reference[field.key])
      if (containsTerm(fieldValue, term)) {
        const isOriginal = profile.originalTerms.has(term)
        const isPhrase = term.includes(' ')
        let multiplier = 1
        if (isOriginal) multiplier += 0.6
        if (isPhrase) multiplier += 0.35
        score += field.weight * multiplier
        matchedTerms.add(term)
        if (isOriginal) matchedOriginalTerms.add(term)
      }
    }
  }

  const strongOriginalMatch = matchedOriginalTerms.size > 0
  const enoughExpandedMatches = matchedTerms.size >= 2
  const accepted = score >= 8 || (strongOriginalMatch && enoughExpandedMatches)

  return {
    accepted,
    score,
    relevance: scoreToRelevance(score),
    matchedTerms: [...matchedTerms].slice(0, 18),
  }
}

function formatPeriod(reference: ReferenceForOffer) {
  const values = [reference.date, reference.duration].filter(Boolean)
  return values.length ? values.join('\n') : 'A compléter'
}

function formatEmployer(reference: ReferenceForOffer) {
  return [
    reference.client,
    reference.title,
    reference.team ? `Équipe / poste : ${reference.team}` : '',
    reference.impact ? `Impact : ${reference.impact}` : '',
    reference.budget ? `Budget : ${reference.budget}` : '',
    'Contact référence : à compléter',
  ]
    .filter(Boolean)
    .join('\n')
}

function activityBullets(reference: ReferenceForOffer) {
  const source = stripHtml(reference.details) || stripHtml(reference.excerpt) || reference.title
  const lines = source
    .split(/\n|•|- /)
    .map((line) => line.replace(/^[•\-\s]+/, '').trim())
    .filter(Boolean)

  const base = (lines.length > 0 ? lines : [source]).slice(0, 8)
  if (reference.technologies.length > 0) base.push(`Technologies / outils : ${reference.technologies.join(', ')}`)
  if (reference.tags.length > 0) base.push(`Mots-clés : ${reference.tags.join(', ')}`)
  return base.map((line) => `• ${line}`).join('\n')
}

function getFilename(label: string) {
  const date = new Date().toISOString().slice(0, 10)
  return `references-offre-${slugify(label)}-${date}.xlsx`
}

function formatDateForExcel(value: unknown) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function getExcelColumnValue(key: ReferenceExcelColumnKey, reference: ReferenceForOffer, matched?: MatchedReference) {
  switch (key) {
    case 'title': return reference.title || '—'
    case 'slug': return reference.slug || '—'
    case 'client': return reference.client || '—'
    case 'country': return reference.country || '—'
    case 'code': return reference.code || '—'
    case 'category': return reference.category || '—'
    case 'date': return reference.date || '—'
    case 'status': return reference.status || '—'
    case 'excerpt': return cleanText(reference.excerpt) || '—'
    case 'details': return cleanText(reference.details) || '—'
    case 'technologies': return reference.technologies.length ? reference.technologies.join(', ') : '—'
    case 'tags': return reference.tags.length ? reference.tags.join(', ') : '—'
    case 'impact': return reference.impact || '—'
    case 'team': return reference.team || '—'
    case 'duration': return reference.duration || '—'
    case 'budget': return reference.budget || '—'
    case 'publishedAt': return formatDateForExcel(reference.publishedAt)
    case 'createdAt': return formatDateForExcel(reference.createdAt)
    case 'updatedAt': return formatDateForExcel(reference.updatedAt)
    case 'lat': return reference.lat ?? '—'
    case 'lng': return reference.lng ?? '—'
    case 'image': return reference.image || '—'
    case 'period': return formatPeriod(reference)
    case 'employer': return formatEmployer(reference)
    case 'activities': return activityBullets(reference)
    case 'relevance': return matched?.relevance ? `${matched.relevance}%` : '—'
    case 'terms': return matched?.matchedTerms?.length ? matched.matchedTerms.join(', ') : '—'
    default: return '—'
  }
}

function columnLetter(index: number) {
  let temp = index
  let letter = ''
  while (temp > 0) {
    const modulo = (temp - 1) % 26
    letter = String.fromCharCode(65 + modulo) + letter
    temp = Math.floor((temp - modulo) / 26)
  }
  return letter
}

function applyHeaderStyle(row: ExcelJS.Row, settings: ExcelExportSettings) {
  const headerBgColor = toArgb(settings.headerBgColor, 'FFEF9F27')
  const headerTextColor = toArgb(settings.headerTextColor, 'FF172033')
  const borderColor = toArgb(settings.borderColor, 'FF9FB0C8')

  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } }
    cell.font = { bold: true, color: { argb: headerTextColor }, size: settings.fontSize }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: borderColor } },
      left: { style: 'thin', color: { argb: borderColor } },
      bottom: { style: 'thin', color: { argb: borderColor } },
      right: { style: 'thin', color: { argb: borderColor } },
    }
  })
}

function applyBodyStyle(row: ExcelJS.Row, settings: ExcelExportSettings, enabledColumns: ReferenceExcelColumnSetting[]) {
  const borderColor = toArgb(settings.borderColor, 'FF9FB0C8')

  row.eachCell((cell, colNumber) => {
    const column = enabledColumns[colNumber - 1]

    cell.font = {
      size: settings.fontSize,
      color: { argb: toArgb(column?.textColor || '#172033', 'FF172033') },
      bold: column?.bold || false,
    }

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: toArgb(column?.bgColor || '#FFFFFF', 'FFFFFFFF') },
    }

    cell.alignment = {
      vertical: 'top',
      horizontal: column?.align || 'left',
      wrapText: column?.wrapText ?? true,
    }

    cell.border = {
      top: { style: 'thin', color: { argb: borderColor } },
      left: { style: 'thin', color: { argb: borderColor } },
      bottom: { style: 'thin', color: { argb: borderColor } },
      right: { style: 'thin', color: { argb: borderColor } },
    }
  })
}

const referenceSelect = {
  id: true,
  country: true,
  code: true,
  lat: true,
  lng: true,
  title: true,
  slug: true,
  excerpt: true,
  image: true,
  details: true,
  date: true,
  client: true,
  category: true,
  tags: true,
  technologies: true,
  impact: true,
  team: true,
  duration: true,
  budget: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
}

async function findReferencesByIds(ids: string[]) {
  const references = await prisma.reference.findMany({
    where: { id: { in: ids } },
    orderBy: [{ date: 'desc' }, { client: 'asc' }],
    select: referenceSelect,
  })

  const byId = new Map(references.map((reference) => [reference.id, reference]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as ReferenceForOffer[]
}

async function findPromptReferences(prompt: string, limit: number) {
  const profile = buildSearchProfile(prompt)

  if (profile.originalTerms.size === 0 && profile.expandedTerms.size === 0) {
    return { profile, references: [] }
  }

  const references = await prisma.reference.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ date: 'desc' }, { client: 'asc' }],
    select: referenceSelect,
  })

  const matched = references
    .map((reference) => {
      const result = scoreReference(reference as ReferenceForOffer, profile)
      return { ...(reference as ReferenceForOffer), matchScore: result.score, relevance: result.relevance, matchedTerms: result.matchedTerms, accepted: result.accepted }
    })
    .filter((reference) => reference.accepted)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
      return String(b.date).localeCompare(String(a.date))
    })
    .slice(0, limit)
    .map(({ accepted, ...reference }) => reference)

  return { profile, references: matched }
}

async function buildXlsxWorkbook(
  references: MatchedReference[] | ReferenceForOffer[],
  title: string,
  criteriaLabel: string,
  detectedDomains: string[],
  settingsInput?: unknown,
) {
  const settings = mergeExcelSettings(settingsInput)
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'MD2I'
  workbook.created = new Date()
  workbook.modified = new Date()

  const titleBgColor = toArgb(settings.titleBgColor, 'FF10233F')
  const titleTextColor = toArgb(settings.titleTextColor, 'FFFFFFFF')

  if (settings.showSummarySheet) {
    const summarySheet = workbook.addWorksheet(settings.summarySheetName, { views: [{ showGridLines: false }] })
    summarySheet.columns = [{ width: 28 }, { width: 80 }]
    summarySheet.mergeCells('A1:B1')
    summarySheet.getCell('A1').value = title
    summarySheet.getCell('A1').font = { bold: true, size: 18, color: { argb: titleTextColor } }
    summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleBgColor } }
    summarySheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }
    summarySheet.getRow(1).height = 32

    const generatedAt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())
    const summaryRows = [
      ['Critère recherché', criteriaLabel],
      ['Domaines détectés', detectedDomains.length ? detectedDomains.join(', ') : 'Aucun domaine spécifique détecté'],
      ['Nombre de références', references.length],
      ['Généré le', generatedAt],
    ]

    summaryRows.forEach((row, index) => {
      const excelRow = summarySheet.addRow(row)
      excelRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD8DEE9' } },
          left: { style: 'thin', color: { argb: 'FFD8DEE9' } },
          bottom: { style: 'thin', color: { argb: 'FFD8DEE9' } },
          right: { style: 'thin', color: { argb: 'FFD8DEE9' } },
        }
        cell.alignment = { vertical: 'top', wrapText: true }
        if (colNumber === 1) {
          cell.font = { bold: true, color: { argb: 'FF172033' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFF4F7FB' : 'FFFFFFFF' } }
        }
      })
    })
  }

  const enabledColumns = settings.columns.filter((column) => column.enabled)
  if (enabledColumns.length === 0) enabledColumns.push(settings.columns[0])

  const sheet = workbook.addWorksheet(settings.referencesSheetName, {
    pageSetup: {
      orientation: settings.orientation,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: false }],
  })

  sheet.columns = enabledColumns.map((column) => ({ key: column.key, width: column.width }))

  const lastColumnLetter = columnLetter(enabledColumns.length)

  sheet.mergeCells(`A1:${lastColumnLetter}1`)
  sheet.getCell('A1').value = title
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: titleTextColor } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleBgColor } }
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 34

  sheet.mergeCells(`A2:${lastColumnLetter}2`)
  sheet.getCell('A2').value = `Critère : ${criteriaLabel} - ${references.length} référence(s)`
  sheet.getCell('A2').font = { size: settings.fontSize, color: { argb: 'FF45546D' } }
  sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F7FB' } }
  sheet.getRow(2).height = 24

  const headerRow = sheet.addRow(enabledColumns.map((column) => column.label))
  applyHeaderStyle(headerRow, settings)

  for (const reference of references) {
    const matched = reference as MatchedReference
    const row = sheet.addRow(enabledColumns.map((column) => getExcelColumnValue(column.key, reference, matched)))
    row.height = settings.rowHeight
    applyBodyStyle(row, settings, enabledColumns)
  }

  return workbook
}

function toPreview(reference: MatchedReference) {
  return {
    id: reference.id,
    title: reference.title,
    client: reference.client,
    country: reference.country,
    date: reference.date,
    category: reference.category,
    technologies: reference.technologies,
    tags: reference.tags,
    excerpt: cleanText(reference.excerpt).slice(0, 260),
    impact: reference.impact,
    duration: reference.duration,
    budget: reference.budget,
    matchScore: reference.matchScore,
    relevance: reference.relevance,
    matchedTerms: reference.matchedTerms,
  }
}

export async function POST(request: NextRequest) {
  const guard = await withPermission(request, { resource: 'references', action: 'canExport' })
  if (!guard.ok) return guard.response

  try {
    const body = await request.json().catch(() => ({}))
    const mode = String(body.mode || '') as ExportMode

    if (mode === 'preview') {
      const prompt = cleanText(body.prompt || '')
      const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200)

      if (prompt.length < 2) {
        return NextResponse.json({ error: 'Écris un sujet d’offre à rechercher' }, { status: 400 })
      }

      const result = await findPromptReferences(prompt, limit)

      return NextResponse.json({
        prompt,
        detectedDomains: result.profile.detectedDomains,
        total: result.references.length,
        references: result.references.map(toPreview),
      })
    }

    let references: ReferenceForOffer[] | MatchedReference[] = []
    let title = 'Références pour offre MD2I'
    let filename = getFilename('selection')
    let criteriaLabel = 'Sélection manuelle'
    let detectedDomains: string[] = []

    if (mode === 'selection') {
      const ids = Array.isArray(body.ids) ? body.ids.map((id: unknown) => String(id)).filter(Boolean) : []

      if (ids.length === 0) {
        return NextResponse.json({ error: 'Aucune référence sélectionnée' }, { status: 400 })
      }

      if (!ids.every(isUuid)) {
        return NextResponse.json({ error: 'Sélection invalide' }, { status: 400 })
      }

      references = await findReferencesByIds(ids)
      title = 'Références sélectionnées pour offre'
      filename = getFilename('selection')
      criteriaLabel = 'Sélection manuelle'
    } else if (mode === 'prompt') {
      const prompt = cleanText(body.prompt || '')
      const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 500)
      const ids = Array.isArray(body.ids) ? body.ids.map((id: unknown) => String(id)).filter(Boolean) : []

      if (prompt.length < 2) {
        return NextResponse.json({ error: 'Écris un sujet d’offre à rechercher' }, { status: 400 })
      }

      if (ids.length > 0) {
        if (!ids.every(isUuid)) {
          return NextResponse.json({ error: 'Sélection invalide' }, { status: 400 })
        }

        const profile = buildSearchProfile(prompt)
        const selectedRefs = await findReferencesByIds(ids)
        references = selectedRefs.map((reference) => {
          const result = scoreReference(reference, profile)
          return { ...reference, matchScore: result.score, relevance: result.relevance, matchedTerms: result.matchedTerms }
        })
        detectedDomains = profile.detectedDomains
      } else {
        const result = await findPromptReferences(prompt, limit)
        references = result.references
        detectedDomains = result.profile.detectedDomains
      }

      title = `Références MD2I - Offre ${prompt.slice(0, 90)}`
      filename = getFilename(prompt)
      criteriaLabel = detectedDomains.length > 0 ? `${prompt} / Domaines détectés : ${detectedDomains.join(', ')}` : prompt
    } else {
      return NextResponse.json({ error: 'Mode export invalide' }, { status: 400 })
    }

    if (references.length === 0) {
      return NextResponse.json(
        { error: mode === 'prompt' ? 'Aucune référence liée à ce sujet' : 'Aucune référence à exporter' },
        { status: 404 },
      )
    }

    const workbook = await buildXlsxWorkbook(references, title, criteriaLabel, detectedDomains, body.settings)
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error('[POST /api/references/export-offer] Error:', error)

    return NextResponse.json(
      { error: 'Erreur serveur pendant l export', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}