export type ExcelAlign = 'left' | 'center' | 'right'

export type ReferenceExcelColumnKey =
  | 'title'
  | 'slug'
  | 'client'
  | 'country'
  | 'code'
  | 'category'
  | 'date'
  | 'status'
  | 'excerpt'
  | 'details'
  | 'technologies'
  | 'tags'
  | 'impact'
  | 'team'
  | 'duration'
  | 'budget'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'lat'
  | 'lng'
  | 'image'
  | 'period'
  | 'employer'
  | 'activities'
  | 'relevance'
  | 'terms'

export type ReferenceExcelColumnSetting = {
  key: ReferenceExcelColumnKey
  enabled: boolean
  label: string
  width: number
  align: ExcelAlign
  bgColor: string
  textColor: string
  bold: boolean
  wrapText: boolean
}

export type ExcelExportSettings = {
  showSummarySheet: boolean
  summarySheetName: string
  referencesSheetName: string
  orientation: 'landscape' | 'portrait'
  titleBgColor: string
  titleTextColor: string
  headerBgColor: string
  headerTextColor: string
  borderColor: string
  fontSize: number
  rowHeight: number
  columns: ReferenceExcelColumnSetting[]
}

export type ExcelExportPresetKey =
  | 'technical_offer'
  | 'client_references'
  | 'company_cv'
  | 'simple_table'
  | 'full_audit'

type PresetColumn = Partial<Omit<ReferenceExcelColumnSetting, 'key'>> & {
  key: ReferenceExcelColumnKey
}

export type ExcelExportPreset = {
  key: ExcelExportPresetKey
  name: string
  description: string
  badge: string
  settings: Partial<Omit<ExcelExportSettings, 'columns'>> & {
    columns: PresetColumn[]
  }
}

export const ALL_REFERENCE_EXCEL_COLUMNS: ReferenceExcelColumnSetting[] = [
  { key: 'title', enabled: true, label: 'Titre', width: 32, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: true, wrapText: true },
  { key: 'client', enabled: true, label: 'Client', width: 28, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'country', enabled: true, label: 'Pays', width: 18, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'category', enabled: true, label: 'Catégorie', width: 28, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'date', enabled: true, label: 'Année / Date', width: 16, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'excerpt', enabled: true, label: 'Extrait', width: 50, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'technologies', enabled: true, label: 'Technologies', width: 34, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'relevance', enabled: true, label: 'Pertinence', width: 14, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: true, wrapText: true },
  { key: 'terms', enabled: true, label: 'Mots détectés', width: 38, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },

  { key: 'status', enabled: false, label: 'Statut', width: 16, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'slug', enabled: false, label: 'Slug', width: 30, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'code', enabled: false, label: 'Code pays', width: 14, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'details', enabled: false, label: 'Détails', width: 70, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'tags', enabled: false, label: 'Tags', width: 34, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'impact', enabled: false, label: 'Impact', width: 40, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'team', enabled: false, label: 'Équipe / poste', width: 26, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'duration', enabled: false, label: 'Durée', width: 18, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'budget', enabled: false, label: 'Budget', width: 20, align: 'right', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'publishedAt', enabled: false, label: 'Date publication', width: 22, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'createdAt', enabled: false, label: 'Date création', width: 22, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'updatedAt', enabled: false, label: 'Date modification', width: 22, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'lat', enabled: false, label: 'Latitude', width: 16, align: 'right', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'lng', enabled: false, label: 'Longitude', width: 16, align: 'right', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'image', enabled: false, label: 'Image', width: 42, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },

  { key: 'period', enabled: false, label: 'Période', width: 18, align: 'center', bgColor: '#FFFFFF', textColor: '#172033', bold: true, wrapText: true },
  { key: 'employer', enabled: false, label: "Nom de l'employeur / poste / référence", width: 42, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
  { key: 'activities', enabled: false, label: 'Activités réalisées', width: 70, align: 'left', bgColor: '#FFFFFF', textColor: '#172033', bold: false, wrapText: true },
]

export const DEFAULT_EXCEL_SETTINGS: ExcelExportSettings = {
  showSummarySheet: true,
  summarySheetName: 'Résumé',
  referencesSheetName: 'Références',
  orientation: 'landscape',
  titleBgColor: '#10233F',
  titleTextColor: '#FFFFFF',
  headerBgColor: '#EF9F27',
  headerTextColor: '#172033',
  borderColor: '#9FB0C8',
  fontSize: 10,
  rowHeight: 110,
  columns: ALL_REFERENCE_EXCEL_COLUMNS.map((column) => ({ ...column })),
}

export const EXCEL_EXPORT_PRESETS: ExcelExportPreset[] = [
  {
    key: 'technical_offer',
    name: 'Offre technique',
    description: 'Format professionnel pour dossier d’appel d’offres.',
    badge: 'Recommandé',
    settings: {
      showSummarySheet: true,
      summarySheetName: 'Résumé offre',
      referencesSheetName: 'Références techniques',
      orientation: 'landscape',
      titleBgColor: '#10233F',
      titleTextColor: '#FFFFFF',
      headerBgColor: '#EF9F27',
      headerTextColor: '#172033',
      borderColor: '#9FB0C8',
      fontSize: 10,
      rowHeight: 125,
      columns: [
        { key: 'period', enabled: true, label: 'Période', width: 18, align: 'center', bold: true },
        { key: 'employer', enabled: true, label: "Nom de l'employeur / poste / référence", width: 44 },
        { key: 'country', enabled: true, label: 'Pays', width: 16, align: 'center' },
        { key: 'activities', enabled: true, label: 'Activités réalisées en rapport avec les services', width: 72 },
        { key: 'technologies', enabled: true, label: 'Technologies / outils', width: 34 },
        { key: 'relevance', enabled: true, label: 'Pertinence', width: 14, align: 'center', bold: true },
        { key: 'terms', enabled: true, label: 'Mots détectés', width: 36 },
      ],
    },
  },
  {
    key: 'client_references',
    name: 'Références client',
    description: 'Tableau clair pour présenter les clients et projets réalisés.',
    badge: 'Commercial',
    settings: {
      showSummarySheet: true,
      summarySheetName: 'Résumé',
      referencesSheetName: 'Références client',
      orientation: 'landscape',
      titleBgColor: '#1E293B',
      titleTextColor: '#FFFFFF',
      headerBgColor: '#0EA5E9',
      headerTextColor: '#FFFFFF',
      borderColor: '#CBD5E1',
      fontSize: 10,
      rowHeight: 95,
      columns: [
        { key: 'title', enabled: true, label: 'Projet', width: 34, bold: true },
        { key: 'client', enabled: true, label: 'Client', width: 28, bold: true },
        { key: 'country', enabled: true, label: 'Pays', width: 16, align: 'center' },
        { key: 'category', enabled: true, label: 'Domaine', width: 28 },
        { key: 'date', enabled: true, label: 'Année', width: 14, align: 'center' },
        { key: 'excerpt', enabled: true, label: 'Résumé du projet', width: 56 },
        { key: 'impact', enabled: true, label: 'Impact / résultat', width: 38 },
      ],
    },
  },
  {
    key: 'company_cv',
    name: 'CV entreprise',
    description: 'Format institutionnel pour références longues et détaillées.',
    badge: 'Institutionnel',
    settings: {
      showSummarySheet: true,
      summarySheetName: 'Synthèse',
      referencesSheetName: 'CV entreprise',
      orientation: 'landscape',
      titleBgColor: '#111827',
      titleTextColor: '#FFFFFF',
      headerBgColor: '#374151',
      headerTextColor: '#FFFFFF',
      borderColor: '#D1D5DB',
      fontSize: 10,
      rowHeight: 130,
      columns: [
        { key: 'period', enabled: true, label: 'Période', width: 18, align: 'center', bold: true },
        { key: 'client', enabled: true, label: 'Client / organisme', width: 28, bold: true },
        { key: 'title', enabled: true, label: 'Mission / projet', width: 38, bold: true },
        { key: 'country', enabled: true, label: 'Pays', width: 15, align: 'center' },
        { key: 'category', enabled: true, label: 'Domaine', width: 25 },
        { key: 'activities', enabled: true, label: 'Description des prestations', width: 70 },
        { key: 'team', enabled: true, label: 'Équipe / rôle', width: 26 },
        { key: 'duration', enabled: true, label: 'Durée', width: 16, align: 'center' },
      ],
    },
  },
  {
    key: 'simple_table',
    name: 'Tableau simple',
    description: 'Export léger, rapide et facile à lire.',
    badge: 'Simple',
    settings: {
      showSummarySheet: false,
      referencesSheetName: 'Références',
      orientation: 'landscape',
      titleBgColor: '#10233F',
      titleTextColor: '#FFFFFF',
      headerBgColor: '#EF9F27',
      headerTextColor: '#172033',
      borderColor: '#E5E7EB',
      fontSize: 10,
      rowHeight: 55,
      columns: [
        { key: 'title', enabled: true, label: 'Titre', width: 34, bold: true },
        { key: 'client', enabled: true, label: 'Client', width: 28 },
        { key: 'country', enabled: true, label: 'Pays', width: 16, align: 'center' },
        { key: 'date', enabled: true, label: 'Année', width: 14, align: 'center' },
        { key: 'category', enabled: true, label: 'Catégorie', width: 28 },
        { key: 'status', enabled: true, label: 'Statut', width: 16, align: 'center' },
      ],
    },
  },
  {
    key: 'full_audit',
    name: 'Audit complet',
    description: 'Export complet avec tous les champs de la base.',
    badge: 'Complet',
    settings: {
      showSummarySheet: true,
      summarySheetName: 'Résumé audit',
      referencesSheetName: 'Audit complet',
      orientation: 'landscape',
      titleBgColor: '#7F1D1D',
      titleTextColor: '#FFFFFF',
      headerBgColor: '#F97316',
      headerTextColor: '#111827',
      borderColor: '#FED7AA',
      fontSize: 9,
      rowHeight: 90,
      columns: [
        { key: 'title', enabled: true, label: 'Titre', width: 32, bold: true },
        { key: 'slug', enabled: true, label: 'Slug', width: 28 },
        { key: 'client', enabled: true, label: 'Client', width: 25 },
        { key: 'country', enabled: true, label: 'Pays', width: 16 },
        { key: 'code', enabled: true, label: 'Code pays', width: 12 },
        { key: 'category', enabled: true, label: 'Catégorie', width: 25 },
        { key: 'date', enabled: true, label: 'Date', width: 14 },
        { key: 'status', enabled: true, label: 'Statut', width: 14 },
        { key: 'excerpt', enabled: true, label: 'Extrait', width: 45 },
        { key: 'details', enabled: true, label: 'Détails', width: 70 },
        { key: 'technologies', enabled: true, label: 'Technologies', width: 32 },
        { key: 'tags', enabled: true, label: 'Tags', width: 32 },
        { key: 'impact', enabled: true, label: 'Impact', width: 36 },
        { key: 'team', enabled: true, label: 'Équipe', width: 24 },
        { key: 'duration', enabled: true, label: 'Durée', width: 16 },
        { key: 'budget', enabled: true, label: 'Budget', width: 18 },
        { key: 'publishedAt', enabled: true, label: 'Publié le', width: 18 },
        { key: 'createdAt', enabled: true, label: 'Créé le', width: 18 },
        { key: 'updatedAt', enabled: true, label: 'Modifié le', width: 18 },
        { key: 'lat', enabled: true, label: 'Latitude', width: 14 },
        { key: 'lng', enabled: true, label: 'Longitude', width: 14 },
        { key: 'image', enabled: true, label: 'Image', width: 42 },
        { key: 'relevance', enabled: true, label: 'Pertinence', width: 14 },
        { key: 'terms', enabled: true, label: 'Mots détectés', width: 32 },
      ],
    },
  },
]

export function cloneDefaultExcelSettings(): ExcelExportSettings {
  return {
    ...DEFAULT_EXCEL_SETTINGS,
    columns: DEFAULT_EXCEL_SETTINGS.columns.map((column) => ({ ...column })),
  }
}

export function applyExcelPreset(
  presetKey: ExcelExportPresetKey,
  currentSettings?: ExcelExportSettings,
): ExcelExportSettings {
  const preset = EXCEL_EXPORT_PRESETS.find((item) => item.key === presetKey)

  if (!preset) {
    return currentSettings ? mergeExcelSettings(currentSettings) : cloneDefaultExcelSettings()
  }

  const base = currentSettings ? mergeExcelSettings(currentSettings) : cloneDefaultExcelSettings()
  const { columns: presetColumns, ...globalSettings } = preset.settings

  const selectedColumns = presetColumns.map((presetColumn) => {
    const defaultColumn =
      ALL_REFERENCE_EXCEL_COLUMNS.find((column) => column.key === presetColumn.key) ||
      ALL_REFERENCE_EXCEL_COLUMNS[0]

    return {
      ...defaultColumn,
      ...presetColumn,
      key: defaultColumn.key,
      enabled: presetColumn.enabled ?? true,
      label: presetColumn.label || defaultColumn.label,
      width: clampNumber(presetColumn.width, 8, 120, defaultColumn.width),
      align: presetColumn.align || defaultColumn.align,
      bgColor: presetColumn.bgColor || defaultColumn.bgColor,
      textColor: presetColumn.textColor || defaultColumn.textColor,
      bold: presetColumn.bold ?? defaultColumn.bold,
      wrapText: presetColumn.wrapText ?? defaultColumn.wrapText,
    }
  })

  const selectedKeys = new Set(selectedColumns.map((column) => column.key))

  const remainingColumns = ALL_REFERENCE_EXCEL_COLUMNS
    .filter((column) => !selectedKeys.has(column.key))
    .map((column) => ({
      ...column,
      enabled: false,
    }))

  return mergeExcelSettings({
    ...base,
    ...globalSettings,
    columns: [...selectedColumns, ...remainingColumns],
  })
}

export function mergeExcelSettings(input: unknown): ExcelExportSettings {
  const raw = typeof input === 'object' && input !== null ? (input as Partial<ExcelExportSettings>) : {}
  const rawColumns = Array.isArray(raw.columns) ? raw.columns : []

  const mergedColumns = ALL_REFERENCE_EXCEL_COLUMNS.map((defaultCol) => {
    const userCol = rawColumns.find((col) => col.key === defaultCol.key)

    return {
      ...defaultCol,
      ...userCol,
      key: defaultCol.key,
      enabled: typeof userCol?.enabled === 'boolean' ? userCol.enabled : defaultCol.enabled,
      label: typeof userCol?.label === 'string' && userCol.label.trim() ? userCol.label.trim() : defaultCol.label,
      width: clampNumber(userCol?.width, 8, 120, defaultCol.width),
      align: userCol?.align === 'left' || userCol?.align === 'center' || userCol?.align === 'right' ? userCol.align : defaultCol.align,
      bgColor: typeof userCol?.bgColor === 'string' ? userCol.bgColor : defaultCol.bgColor,
      textColor: typeof userCol?.textColor === 'string' ? userCol.textColor : defaultCol.textColor,
      bold: typeof userCol?.bold === 'boolean' ? userCol.bold : defaultCol.bold,
      wrapText: typeof userCol?.wrapText === 'boolean' ? userCol.wrapText : defaultCol.wrapText,
    }
  })

  const orderedColumns = rawColumns.length
    ? [
        ...rawColumns
          .map((rawColumn) => mergedColumns.find((column) => column.key === rawColumn.key))
          .filter(Boolean),
        ...mergedColumns.filter(
          (column) => !rawColumns.some((rawColumn) => rawColumn.key === column.key),
        ),
      ] as ReferenceExcelColumnSetting[]
    : mergedColumns

  if (!orderedColumns.some((col) => col.enabled)) {
    orderedColumns[0].enabled = true
  }

  return {
    showSummarySheet: typeof raw.showSummarySheet === 'boolean' ? raw.showSummarySheet : DEFAULT_EXCEL_SETTINGS.showSummarySheet,
    summarySheetName: safeSheetName(raw.summarySheetName, DEFAULT_EXCEL_SETTINGS.summarySheetName),
    referencesSheetName: safeSheetName(raw.referencesSheetName, DEFAULT_EXCEL_SETTINGS.referencesSheetName),
    orientation: raw.orientation === 'portrait' || raw.orientation === 'landscape' ? raw.orientation : DEFAULT_EXCEL_SETTINGS.orientation,
    titleBgColor: typeof raw.titleBgColor === 'string' ? raw.titleBgColor : DEFAULT_EXCEL_SETTINGS.titleBgColor,
    titleTextColor: typeof raw.titleTextColor === 'string' ? raw.titleTextColor : DEFAULT_EXCEL_SETTINGS.titleTextColor,
    headerBgColor: typeof raw.headerBgColor === 'string' ? raw.headerBgColor : DEFAULT_EXCEL_SETTINGS.headerBgColor,
    headerTextColor: typeof raw.headerTextColor === 'string' ? raw.headerTextColor : DEFAULT_EXCEL_SETTINGS.headerTextColor,
    borderColor: typeof raw.borderColor === 'string' ? raw.borderColor : DEFAULT_EXCEL_SETTINGS.borderColor,
    fontSize: clampNumber(raw.fontSize, 8, 18, DEFAULT_EXCEL_SETTINGS.fontSize),
    rowHeight: clampNumber(raw.rowHeight, 35, 260, DEFAULT_EXCEL_SETTINGS.rowHeight),
    columns: orderedColumns,
  }
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value)

  if (!Number.isFinite(number)) return fallback

  return Math.min(max, Math.max(min, number))
}

export function safeSheetName(value: unknown, fallback: string) {
  const name = String(value || fallback)
    .replace(/[\\/*?:[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31)

  return name || fallback
}

export function toArgb(hex: string, fallback: string) {
  const clean = String(hex || '').trim().replace('#', '').toUpperCase()

  if (/^[0-9A-F]{6}$/.test(clean)) {
    return `FF${clean}`
  }

  return fallback
}