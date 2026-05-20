'use client'

import { DEFAULT_LOCALE, type Locale } from './settings'

type TranslationEntry = {
  itemIndex: number
  path: string
  value: string
}

const translationCache = new Map<string, string>()
const MAX_DYNAMIC_TEXT_LENGTH = 5000

function getPathValue(item: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined

    return (current as Record<string, unknown>)[key]
  }, item)
}

function setPathValue<T>(item: T, path: string, value: string): T {
  if (!item || typeof item !== 'object') return item

  const parts = path.split('.')
  const root = Array.isArray(item) ? [...item] : { ...(item as object) }
  let cursor: Record<string, unknown> = root as Record<string, unknown>
  let sourceCursor = item as Record<string, unknown>

  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index]
    const sourceValue = sourceCursor?.[key]

    if (!sourceValue || typeof sourceValue !== 'object') return item

    const nextValue = Array.isArray(sourceValue)
      ? [...sourceValue]
      : { ...(sourceValue as object) }

    cursor[key] = nextValue
    cursor = nextValue as Record<string, unknown>
    sourceCursor = sourceValue as Record<string, unknown>
  }

  cursor[parts[parts.length - 1]] = value

  return root as T
}

function cacheKey(text: string, target: Locale, source: Locale) {
  return `${source}:${target}:${text}`
}

async function fetchTranslations(
  texts: string[],
  target: Locale,
  source: Locale,
) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts, target, source }),
  })

  if (!response.ok) {
    throw new Error('Translation request failed')
  }

  const data = (await response.json()) as { translations?: unknown }

  return Array.isArray(data.translations)
    ? data.translations.map((value, index) =>
        typeof value === 'string' ? value : texts[index],
      )
    : texts
}

export async function translateDynamicItems<T>(
  items: T[],
  target: Locale,
  paths: string[],
  source: Locale = DEFAULT_LOCALE,
): Promise<T[]> {
  if (target === source || items.length === 0 || paths.length === 0) {
    return items
  }

  const entries: TranslationEntry[] = []

  items.forEach((item, itemIndex) => {
    paths.forEach((path) => {
      const value = getPathValue(item, path)

      if (
        typeof value === 'string' &&
        value.trim() &&
        value.length <= MAX_DYNAMIC_TEXT_LENGTH
      ) {
        entries.push({ itemIndex, path, value })
      }
    })
  })

  if (entries.length === 0) return items

  const missing = Array.from(new Set(entries.map((entry) => entry.value))).filter(
    (text) => !translationCache.has(cacheKey(text, target, source)),
  )

  for (let index = 0; index < missing.length; index += 40) {
    const chunk = missing.slice(index, index + 40)
    const translated = await fetchTranslations(chunk, target, source).catch(
      () => chunk,
    )

    chunk.forEach((text, chunkIndex) => {
      translationCache.set(
        cacheKey(text, target, source),
        translated[chunkIndex] || text,
      )
    })
  }

  return items.map((item, itemIndex) => {
    let nextItem = item

    entries
      .filter((entry) => entry.itemIndex === itemIndex)
      .forEach((entry) => {
        const translated =
          translationCache.get(cacheKey(entry.value, target, source)) ||
          entry.value

        nextItem = setPathValue(nextItem, entry.path, translated)
      })

    return nextItem
  })
}
