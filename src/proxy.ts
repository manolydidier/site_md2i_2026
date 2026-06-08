import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

const ARTICLE_UUID_PATH_RE =
  /^\/articles\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i

type PublicArticleResponse = {
  slug?: string | null
}

function decodeIdentifier(value: string) {
  try {
    return decodeURIComponent(value).trim()
  } catch {
    return value.trim()
  }
}

async function redirectArticleIdToSlug(request: NextRequest) {
  const match = request.nextUrl.pathname.match(ARTICLE_UUID_PATH_RE)
  const rawArticleId = match?.[1]

  if (!rawArticleId) {
    return null
  }

  const articleId = decodeIdentifier(rawArticleId)

  try {
    const apiUrl = new URL(
      `/api/articles/${encodeURIComponent(articleId)}`,
      request.nextUrl.origin,
    )

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const article = (await response.json()) as PublicArticleResponse
    const slug = article.slug?.trim()

    if (!slug || slug.toLowerCase() === articleId.toLowerCase()) {
      return null
    }

    const target = new URL(request.url)
    const host = request.headers.get('host')
    const forwardedProto = request.headers.get('x-forwarded-proto')

    if (host) {
      target.host = host
    }

    if (forwardedProto) {
      target.protocol = `${forwardedProto}:`
    }

    target.pathname = `/articles/${encodeURIComponent(slug)}`

    return NextResponse.redirect(target, 308)
  } catch (error) {
    console.error('[proxy] Article slug redirect failed:', error)
    return null
  }
}

const adminAuthProxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = req.nextUrl.pathname === '/login'

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
})

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/articles/')) {
    return (await redirectArticleIdToSlug(request)) ?? NextResponse.next()
  }

  return adminAuthProxy(request)
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/articles/:articleId'],
}
