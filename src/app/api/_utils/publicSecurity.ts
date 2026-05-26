import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.2:3000',
]

function getAllowedOrigins() {
  const fromEnv = process.env.PUBLIC_ALLOWED_ORIGINS

  if (!fromEnv) {
    return DEFAULT_ALLOWED_ORIGINS
  }

  return fromEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getRequestOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin) {
    return origin
  }

  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      return null
    }
  }

  return null
}

export function isAllowedPublicOrigin(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request)

  // Autorise les appels serveur à serveur, curl, Postman, ou certains same-origin sans Origin.
  if (!requestOrigin) {
    return true
  }

  const allowedOrigins = getAllowedOrigins()

  return allowedOrigins.includes(requestOrigin)
}

export function forbiddenOriginResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Forbidden origin',
    },
    {
      status: 403,
    }
  )
}

export function requireAllowedPublicOrigin(request: NextRequest) {
  if (!isAllowedPublicOrigin(request)) {
    return forbiddenOriginResponse()
  }

  return null
}

export async function readLimitedJson<T = unknown>(
  request: NextRequest,
  maxBytes = 32_000
): Promise<T> {
  const contentType = request.headers.get('content-type') || ''

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('INVALID_CONTENT_TYPE')
  }

  const contentLength = request.headers.get('content-length')

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error('PAYLOAD_TOO_LARGE')
  }

  const text = await request.text()

  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error('PAYLOAD_TOO_LARGE')
  }

  return JSON.parse(text) as T
}