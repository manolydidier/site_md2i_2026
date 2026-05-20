export const DEFAULT_LOCALE = 'fr' as const

export const SUPPORTED_LOCALES = ['fr', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const I18N_STORAGE_KEY = 'md2i.locale'

export const LANGUAGE_OPTIONS: Array<{
  code: Locale
  shortLabel: string
  label: string
}> = [
  { code: 'fr', shortLabel: 'FR', label: 'Français' },
  { code: 'en', shortLabel: 'EN', label: 'English' },
]

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== 'string') return DEFAULT_LOCALE

  const candidate = value.toLowerCase().split(/[-_]/)[0]

  return isLocale(candidate) ? candidate : DEFAULT_LOCALE
}
