import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { PostStatus, Prisma } from '@/generated/prisma/client'
import { withPermission } from '@/(permisionGuard)/lib/permissions'

async function getPublicArticles(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '9')))

  const search = (searchParams.get('search') ?? '').trim()
  const category = (searchParams.get('category') ?? '').trim()
  const sort = (searchParams.get('sort') ?? 'date-desc').trim()

  const where: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(category && {
      category: { is: { slug: category } },
    }),
  }

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sort === 'date-asc'
      ? { createdAt: 'asc' }
      : sort === 'title-asc'
        ? { title: 'asc' }
        : sort === 'title-desc'
          ? { title: 'desc' }
          : { createdAt: 'desc' }

  try {
    const [articles, total, categories] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          author: { select: { email: true } },
        },
      }),
      prisma.post.count({ where }),
      prisma.category.findMany({
        where: {
          posts: { some: { status: 'PUBLISHED' } },
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return Response.json({
      data: articles,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    console.error('[GET /api/articles/public][public]', err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function getBackofficeArticles(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))

  const search = (searchParams.get('search') ?? '').trim()
  const category = (searchParams.get('category') ?? '').trim()
  const status = (searchParams.get('status') ?? 'all').trim()
  const sortBy = (searchParams.get('sortBy') ?? 'createdAt').trim()
  const sortDir = (searchParams.get('sortDir') ?? 'desc').trim() === 'asc' ? 'asc' : 'desc'

  const where: Prisma.PostWhereInput = {
    ...(status !== 'all' && {
      status: status as PostStatus,
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(category && {
      OR: [
        { categoryId: category },
        { category: { is: { slug: category } } },
      ],
    }),
  }

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sortBy === 'title'
      ? { title: sortDir }
      : sortBy === 'status'
        ? { status: sortDir }
        : sortBy === 'updatedAt'
          ? { updatedAt: sortDir }
          : sortBy === 'publishedAt'
            ? { publishedAt: sortDir }
            : { createdAt: sortDir }

  try {
    const [articles, total, categories] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          authorId: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, email: true } },
          tags: { select: { tagId: true } },
        },
      }),
      prisma.post.count({ where }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    return Response.json({
      data: articles,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    console.error('[GET /api/articles/public][backoffice]', err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scope = (searchParams.get('scope') ?? '').trim()

  if (scope === 'backoffice') {
    const guard = await withPermission(req, { resource: 'posts', action: 'canList' })
    if (!guard.ok) return guard.response
    return getBackofficeArticles(req)
  }

  return getPublicArticles(req)
}
