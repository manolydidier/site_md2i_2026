'use client'

import { DEFAULT_LOCALE, type Locale } from './settings'

type TranslationEntry = {
  itemIndex: number
  path: string
  value: string
}

type TextNodeEntry = {
  node: Text
  value: string
}

const translationCache = new Map<string, string>()
const MAX_DYNAMIC_TEXT_LENGTH = 5000
const TRANSLATABLE_COMPONENT_KEYS = new Set([
  'content',
  'label',
  'text',
])
const TRANSLATABLE_ATTRIBUTE_KEYS = new Set([
  'alt',
  'aria-label',
  'placeholder',
  'title',
])
const SKIPPED_HTML_TAGS = new Set([
  'CODE',
  'NOSCRIPT',
  'PRE',
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
])

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

function shouldTranslateValue(value: string) {
  const text = value.trim()

  return (
    Boolean(text) &&
    text.length <= MAX_DYNAMIC_TEXT_LENGTH &&
    /[\p{L}\p{N}]/u.test(text)
  )
}

function preserveOuterWhitespace(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? ''
  const trailing = original.match(/\s*$/)?.[0] ?? ''

  return `${leading}${translated}${trailing}`
}

export async function translateDynamicTexts(
  texts: string[],
  target: Locale,
  source: Locale = DEFAULT_LOCALE,
) {
  if (target === source || texts.length === 0) {
    return texts
  }

  const normalizedTexts = texts.map((text) => text.trim())
  const missing = Array.from(new Set(normalizedTexts)).filter(
    (text) =>
      shouldTranslateValue(text) &&
      !translationCache.has(cacheKey(text, target, source)),
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

  return normalizedTexts.map(
    (text) => translationCache.get(cacheKey(text, target, source)) || text,
  )
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

  await translateDynamicTexts(
    entries.map((entry) => entry.value),
    target,
    source,
  )

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

export async function translateHtmlContent(
  html: string | null | undefined,
  target: Locale,
  source: Locale = DEFAULT_LOCALE,
) {
  if (!html || target === source || typeof window === 'undefined') {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const entries: TextNodeEntry[] = []
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const parentTag = node.parentElement?.tagName

    if (
      parentTag &&
      SKIPPED_HTML_TAGS.has(parentTag) &&
      shouldTranslateValue(node.nodeValue || '')
    ) {
      continue
    }

    const value = node.nodeValue || ''

    if (shouldTranslateValue(value)) {
      entries.push({ node, value })
    }
  }

  if (!entries.length) {
    return html
  }

  const translations = await translateDynamicTexts(
    entries.map((entry) => entry.value),
    target,
    source,
  )

  entries.forEach((entry, index) => {
    entry.node.nodeValue = preserveOuterWhitespace(
      entry.value,
      translations[index] || entry.value.trim(),
    )
  })

  return doc.body.innerHTML
}

function collectComponentTexts(value: unknown, texts: string[]) {
  if (!value) return

  if (typeof value === 'string') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectComponentTexts(item, texts))
    return
  }

  if (typeof value !== 'object') {
    return
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    if (
      TRANSLATABLE_COMPONENT_KEYS.has(key) &&
      typeof entry === 'string' &&
      shouldTranslateValue(entry)
    ) {
      texts.push(entry)
      return
    }

    if (key === 'attributes' && entry && typeof entry === 'object') {
      Object.entries(entry as Record<string, unknown>).forEach(
        ([attributeKey, attributeValue]) => {
          if (
            TRANSLATABLE_ATTRIBUTE_KEYS.has(attributeKey) &&
            typeof attributeValue === 'string' &&
            shouldTranslateValue(attributeValue)
          ) {
            texts.push(attributeValue)
          }
        },
      )
      return
    }

    collectComponentTexts(entry, texts)
  })
}

function translateComponentValue(
  value: unknown,
  translations: Map<string, string>,
): unknown {
  if (!value) return value

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => translateComponentValue(item, translations))
  }

  if (typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (TRANSLATABLE_COMPONENT_KEYS.has(key) && typeof entry === 'string') {
        const translated = translations.get(entry.trim())

        return [
          key,
          translated ? preserveOuterWhitespace(entry, translated) : entry,
        ]
      }

      if (key === 'attributes' && entry && typeof entry === 'object') {
        return [
          key,
          Object.fromEntries(
            Object.entries(entry as Record<string, unknown>).map(
              ([attributeKey, attributeValue]) => {
                if (
                  TRANSLATABLE_ATTRIBUTE_KEYS.has(attributeKey) &&
                  typeof attributeValue === 'string'
                ) {
                  const translated = translations.get(attributeValue.trim())

                  return [
                    attributeKey,
                    translated
                      ? preserveOuterWhitespace(attributeValue, translated)
                      : attributeValue,
                  ]
                }

                return [attributeKey, attributeValue]
              },
            ),
          ),
        ]
      }

      return [key, translateComponentValue(entry, translations)]
    }),
  )
}

export async function translateGrapesComponents<T>(
  components: T,
  target: Locale,
  source: Locale = DEFAULT_LOCALE,
): Promise<T> {
  if (!components || target === source) {
    return components
  }

  if (typeof components === 'string') {
    return translateHtmlContent(components, target, source) as Promise<T>
  }

  const texts: string[] = []
  collectComponentTexts(components, texts)

  if (!texts.length) {
    return components
  }

  const translated = await translateDynamicTexts(texts, target, source)
  const translationMap = new Map<string, string>()

  texts.forEach((text, index) => {
    translationMap.set(text.trim(), translated[index] || text.trim())
  })

  return translateComponentValue(components, translationMap) as T
}
