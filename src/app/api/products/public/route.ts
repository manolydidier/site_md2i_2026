import { NextRequest, NextResponse } from 'next/server'
        import { Prisma } from '../../../../generated/prisma/client'
import * as prismaModule from '@/app/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = ((prismaModule as any).default ??
  (prismaModule as any).prisma ??
  prismaModule) as {
  product: any
  $transaction: <T>(queries: Promise<T>[]) => Promise<T[]>
}

type PublicProductSortKey =
  | 'published-desc'
  | 'published-asc'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseNullableNumber(value: string | null) {
  if (!value?.trim()) return null
  const normalized = value.replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNullableBoolean(value: string | null): boolean | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()

  if (['1', 'true', 'yes', 'with'].includes(normalized)) return true
  if (['0', 'false', 'no', 'without'].includes(normalized)) return false

  return null
}

function getOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  const sortKey = (sort || 'published-desc') as PublicProductSortKey

  switch (sortKey) {
    case 'published-asc':
      return [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
    case 'price-asc':
      return [{ price: 'asc' }, { publishedAt: 'desc' }]
    case 'price-desc':
      return [{ price: 'desc' }, { publishedAt: 'desc' }]
    case 'name-asc':
      return [{ name: 'asc' }, { publishedAt: 'desc' }]
    case 'name-desc':
      return [{ name: 'desc' }, { publishedAt: 'desc' }]
    case 'published-desc':
    default:
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
  }
}

function toSerializableNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value === 'object') {
    const record = value as { toNumber?: () => number; toString?: () => string }

    if (typeof record.toNumber === 'function') {
      const parsed = record.toNumber()
      return Number.isFinite(parsed) ? parsed : null
    }

    if (typeof record.toString === 'function') {
      const parsed = Number(record.toString())
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
}

function serializeProduct(item: any) {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    excerpt: item.excerpt ?? null,
    price: toSerializableNumber(item.price),
    coverImage: item.coverImage ?? null,
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug ?? null,
        }
      : null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const page = clamp(parsePositiveInt(searchParams.get('page'), 1), 1, 100000)
    const limit = clamp(parsePositiveInt(searchParams.get('limit'), 9), 1, 24)
    const search = searchParams.get('search')?.trim() ?? ''
    const category = searchParams.get('category')?.trim() ?? ''
    const hasImage = parseNullableBoolean(searchParams.get('hasImage'))
    const sort = searchParams.get('sort')?.trim() ?? 'published-desc'

    let minPrice = parseNullableNumber(searchParams.get('minPrice'))
    let maxPrice = parseNullableNumber(searchParams.get('maxPrice'))

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      const temp = minPrice
      minPrice = maxPrice
      maxPrice = temp
    }

    const basePublishedWhere: Prisma.ProductWhereInput = {
      publishedAt: { not: null },
    }

    const filters: Prisma.ProductWhereInput[] = [basePublishedWhere]

    if (search) {
      filters.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (category) {
      filters.push({
        OR: [
          { categoryId: category },
          { category: { slug: { equals: category, mode: 'insensitive' } } },
          { category: { name: { equals: category, mode: 'insensitive' } } },
        ],
      })
    }

    if (minPrice !== null) {
      filters.push({
        price: { gte: minPrice },
      })
    }

    if (maxPrice !== null) {
      filters.push({
        price: { lte: maxPrice },
      })
    }

    if (hasImage === true) {
      filters.push({
        NOT: [{ coverImage: null }, { coverImage: '' }],
      })
    }

    if (hasImage === false) {
      filters.push({
        OR: [{ coverImage: null }, { coverImage: '' }],
      })
    }

    const where: Prisma.ProductWhereInput =
      filters.length === 1 ? filters[0] : { AND: filters }

    const skip = (page - 1) * limit
    const orderBy = getOrderBy(sort)

    const [products, total, categoryRows] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          excerpt: true,
          price: true,
          coverImage: true,
          publishedAt: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: basePublishedWhere,
        distinct: ['categoryId'],
        orderBy: [{ categoryId: 'asc' }],
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ])

    const categoriesMap = new Map<string, { id: string; name: string; slug: string | null }>()

    for (const row of categoryRows as Array<{ category?: { id: string; name: string; slug?: string | null } | null }>) {
      if (!row.category?.id) continue
      categoriesMap.set(row.category.id, {
        id: row.category.id,
        name: row.category.name,
        slug: row.category.slug ?? null,
      })
    }

    const categories = Array.from(categoriesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    )

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      data: products.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        categories,
      },
    })
  } catch (error) {
    console.error('GET /api/products/public failed:', error)

    return NextResponse.json(
      { error: 'Impossible de charger les produits publics.' },
      { status: 500 }
    )
  }
}