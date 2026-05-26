import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ProductSort =
  | 'newest'
  | 'oldest'
  | 'date-desc'
  | 'date-asc'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'

function cleanString(value: string | null) {
  return String(value || '').trim()
}

function normalizePage(value: string | null) {
  const page = Number(value)

  if (!Number.isFinite(page) || page < 1) {
    return 1
  }

  return Math.floor(page)
}

function normalizeLimit(value: string | null) {
  const limit = Number(value)

  if (!Number.isFinite(limit) || limit < 1) {
    return 12
  }

  return Math.min(Math.floor(limit), 48)
}

function normalizeSort(value: string | null): ProductSort {
  const sort = cleanString(value) as ProductSort

  if (
    sort === 'newest' ||
    sort === 'oldest' ||
    sort === 'date-desc' ||
    sort === 'date-asc' ||
    sort === 'name-asc' ||
    sort === 'name-desc' ||
    sort === 'price-asc' ||
    sort === 'price-desc'
  ) {
    return sort
  }

  return 'date-desc'
}

function getOrderBy(sort: ProductSort) {
  if (sort === 'oldest' || sort === 'date-asc') {
    return [{ publishedAt: 'asc' as const }, { createdAt: 'asc' as const }]
  }

  if (sort === 'name-asc') {
    return [{ name: 'asc' as const }]
  }

  if (sort === 'name-desc') {
    return [{ name: 'desc' as const }]
  }

  if (sort === 'price-asc') {
    return [{ price: 'asc' as const }, { publishedAt: 'desc' as const }]
  }

  if (sort === 'price-desc') {
    return [{ price: 'desc' as const }, { publishedAt: 'desc' as const }]
  }

  return [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }]
}

function toSerializablePrice(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value &&
    typeof value.toString === 'function'
  ) {
    return value.toString()
  }

  return value
}

function serializeProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    excerpt: product.excerpt,
    price: toSerializablePrice(product.price),
    coverImage: product.coverImage,
    images: product.images,
    status: product.status,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
  }
}

function serializeCategory(category: any) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query = cleanString(searchParams.get('q'))
    const category = cleanString(searchParams.get('category'))
    const page = normalizePage(searchParams.get('page'))
    const limit = normalizeLimit(searchParams.get('limit'))
    const sort = normalizeSort(searchParams.get('sort'))

    const skip = (page - 1) * limit
    const take = limit
    const orderBy = getOrderBy(sort)

    const where: any = {
      status: 'PUBLISHED',
    }

    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          category: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    if (category && category !== 'all') {
      where.category = {
        OR: [
          {
            slug: {
              equals: category,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: category,
              mode: 'insensitive',
            },
          },
        ],
      }
    }

    const productsPromise = prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        slug: true,
        excerpt: true,
        price: true,
        coverImage: true,
        images: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    const totalPromise = prisma.product.count({
      where,
    })

    const categoriesPromise = prisma.productCategory.findMany({
      where: {
        products: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    const [products, total, categoryRows] = await Promise.all([
      productsPromise,
      totalPromise,
      categoriesPromise,
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      ok: true,
      products: products.map(serializeProduct),
      categories: categoryRows.map(serializeCategory),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        q: query,
        category,
        sort,
      },
    })
  } catch (error) {
    console.error('[GET /api/products/public] Error:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Impossible de charger les produits publics.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}