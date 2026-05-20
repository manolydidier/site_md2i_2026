'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './client'
import { DEFAULT_LOCALE, I18N_STORAGE_KEY, normalizeLocale } from './settings'

function getInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  return normalizeLocale(
    window.localStorage.getItem(I18N_STORAGE_KEY) || window.navigator.language,
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const locale = getInitialLocale()
    const syncDocumentLocale = (language: string) => {
      const nextLocale = normalizeLocale(language)

      document.documentElement.lang = nextLocale
      window.localStorage.setItem(I18N_STORAGE_KEY, nextLocale)
    }

    i18n.on('languageChanged', syncDocumentLocale)
    syncDocumentLocale(locale)

    if (normalizeLocale(i18n.resolvedLanguage || i18n.language) !== locale) {
      void i18n.changeLanguage(locale)
    }

    return () => {
      i18n.off('languageChanged', syncDocumentLocale)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
