import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

function decodeIdentifier(value?: string | null) {
  try {
    return decodeURIComponent(value ?? '').trim()
  } catch {
    return String(value ?? '').trim()
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId: rawArticleId } = await context.params
    const articleId = decodeIdentifier(rawArticleId)

    if (!articleId) {
      return NextResponse.json(
        { error: 'Identifiant article invalide' },
        { status: 400 },
      )
    }

    const post = await prisma.post.findFirst({
      where: {
        status: 'PUBLISHED',
        OR: [
          {
            slug: {
              equals: articleId,
              mode: 'insensitive',
            },
          },
          ...(isUuid(articleId)
            ? [
                {
                  id: articleId,
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        gjsHtml: true,
        gjsStyles: true,
        gjsJs: true,
        gjsComponents: true,
        author: {
          select: {
            
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('[GET /api/articles/[articleId]]', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
