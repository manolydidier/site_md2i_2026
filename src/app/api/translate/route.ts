import { NextResponse } from 'next/server'
import { type Locale, normalizeLocale } from '@/app/i18n/settings'

const MAX_TEXTS = 60
const MAX_TEXT_LENGTH = 5000
const responseCache = new Map<string, string>()

function cacheKey(text: string, source: Locale, target: Locale) {
  return `${source}:${target}:${text}`
}

function normalizeTexts(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function translateWithCloudApi(
  texts: string[],
  source: Locale,
  target: Locale,
) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY

  if (!key) return null

  const url = new URL('https://translation.googleapis.com/language/translate/v2')
  url.searchParams.set('key', key)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: texts,
      source,
      target,
      format: 'text',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Cloud Translate failed: ${response.status}`)
  }

  const data = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> }
  }

  return texts.map(
    (text, index) =>
      data.data?.translations?.[index]?.translatedText?.trim() || text,
  )
}

async function translateWithPublicEndpoint(
  text: string,
  source: Locale,
  target: Locale,
) {
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', source)
  url.searchParams.set('tl', target)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Google Translate failed: ${response.status}`)
  }

  const data = (await response.json()) as unknown

  if (!Array.isArray(data) || !Array.isArray(data[0])) return text

  const translated = data[0]
    .map((part) => (Array.isArray(part) ? part[0] : ''))
    .filter((part): part is string => typeof part === 'string')
    .join('')
    .trim()

  return translated || text
}

async function translateTexts(texts: string[], source: Locale, target: Locale) {
  if (source === target) return texts

  const cached = texts.map((text) =>
    responseCache.get(cacheKey(text, source, target)),
  )
  const missing = texts.filter((text, index) => !cached[index])

  if (missing.length > 0) {
    const cloudTranslations = await translateWithCloudApi(
      missing,
      source,
      target,
    ).catch(() => null)

    const translated =
      cloudTranslations ??
      (await Promise.all(
        missing.map((text) =>
          translateWithPublicEndpoint(text, source, target).catch(() => text),
        ),
      ))

    missing.forEach((text, index) => {
      responseCache.set(
        cacheKey(text, source, target),
        translated[index] || text,
      )
    })
  }

  return texts.map(
    (text) => responseCache.get(cacheKey(text, source, target)) || text,
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      texts?: unknown
      target?: unknown
      source?: unknown
    }

    const texts = normalizeTexts(body.texts)
    const target = normalizeLocale(body.target)
    const source = normalizeLocale(body.source)

    if (texts.length > MAX_TEXTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TEXTS} texts per request.` },
        { status: 400 },
      )
    }

    if (texts.some((text) => text.length > MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TEXT_LENGTH} characters per text.` },
        { status: 400 },
      )
    }

    const translations = await translateTexts(texts, source, target)

    return NextResponse.json({ translations, source, target })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Translation failed.' },
      { status: 500 },
    )
  }
}
