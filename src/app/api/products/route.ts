// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma, ProductStatus } from '@/generated/prisma/client'

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

type ProductPayload = {
  name?: unknown
  slug?: unknown
  excerpt?: unknown
  price?: unknown
  coverImage?: unknown
  images?: unknown
  status?: unknown
  categoryId?: unknown
  authorId?: unknown
  userId?: unknown
  gjsComponents?: unknown
  gjsStyles?: unknown
  gjsHtml?: unknown
  gjsJs?: unknown
  publishedAt?: unknown
  publish?: unknown
  isPublished?: unknown
}

type ProductStatusValue = (typeof ProductStatus)[keyof typeof ProductStatus]

function cleanString(value: unknown) {
  if (value === null || value === undefined) return ''

  return String(value).trim()
}

function nullableString(value: unknown) {
  const cleaned = cleanString(value)

  return cleaned.length > 0 ? cleaned : null
}

function normalizeProductStatus(value: unknown): ProductStatusValue | null {
  const status = nullableString(value)?.toUpperCase()

  if (status === ProductStatus.DRAFT) return ProductStatus.DRAFT
  if (status === ProductStatus.PUBLISHED) return ProductStatus.PUBLISHED
  if (status === ProductStatus.ARCHIVED) return ProductStatus.ARCHIVED

  return null
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

function getOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === 'oldest' || sort === 'date-asc') {
    return [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
  }

  if (sort === 'name-asc') {
    return [{ name: 'asc' }]
  }

  if (sort === 'name-desc') {
    return [{ name: 'desc' }]
  }

  if (sort === 'price-asc') {
    return [{ price: 'asc' }, { publishedAt: 'desc' }]
  }

  if (sort === 'price-desc') {
    return [{ price: 'desc' }, { publishedAt: 'desc' }]
  }

  return [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

async function buildUniqueSlug(input: string) {
  const baseSlug = slugify(input) || `produit-${Date.now()}`
  let candidate = baseSlug
  let index = 2

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidate,
      },
      select: {
        id: true,
      },
    })

    if (!existing) {
      return candidate
    }

    candidate = `${baseSlug}-${index}`
    index += 1
  }
}

function parsePrice(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function parseImages(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (value === null) return []

  const normalizeList = (items: unknown[]) =>
    items
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)

  if (Array.isArray(value)) {
    return normalizeList(value)
  }

  if (typeof value === 'string') {
    const cleaned = value.trim()

    if (!cleaned) return []

    try {
      const parsed = JSON.parse(cleaned)

      return Array.isArray(parsed) ? normalizeList(parsed) : [cleaned]
    } catch {
      return [cleaned]
    }
  }

  return undefined
}

function parseDate(value: unknown) {
  if (!value) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

function parseJsonValue(
  value: unknown
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined

  if (value === null) return Prisma.JsonNull

  if (typeof value === 'string') {
    const cleaned = value.trim()

    if (!cleaned) return undefined

    try {
      const parsed = JSON.parse(cleaned)

      return parsed === null
        ? Prisma.JsonNull
        : (parsed as Prisma.InputJsonValue)
    } catch {
      return cleaned as Prisma.InputJsonValue
    }
  }

  return value as Prisma.InputJsonValue
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

type ProductCategorySummary = {
  id: string
  name: string
  slug: string | null
}

type ProductSummary = {
  id: string
  name: string
  slug: string
  excerpt: string | null
  price: unknown
  coverImage: string | null
  images: unknown
  status: ProductStatusValue
  publishedAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  category: ProductCategorySummary | null
}

function serializeProduct(product: ProductSummary) {
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

function serializeCategory(category: ProductCategorySummary) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
    },
  })
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

    const where: Prisma.ProductWhereInput = {
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

    return json({
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
    console.error('[GET /api/products] Error:', error)

    return json(
      {
        ok: false,
        error: 'Impossible de charger les produits.',
        details:
          process.env.NODE_ENV === 'development'
            ? getErrorMessage(error)
            : undefined,
      },
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ProductPayload | null

    if (!body) {
      return json(
        {
          ok: false,
          error: 'Payload JSON invalide.',
        },
        400
      )
    }

    const name = nullableString(body.name)

    if (!name) {
      return json(
        {
          ok: false,
          error: 'Le nom du produit est requis.',
        },
        400
      )
    }

    const wantedSlug = nullableString(body.slug) || name
    const slug = await buildUniqueSlug(wantedSlug)

    const excerpt = nullableString(body.excerpt)
    const coverImage = nullableString(body.coverImage)
    const categoryId = nullableString(body.categoryId)
    const authorId = nullableString(body.authorId) || nullableString(body.userId)

    if (!authorId) {
      return json(
        {
          ok: false,
          error:
            "Le produit n'a pas pu etre cree car authorId est requis par le modele Product.",
        },
        400
      )
    }

    const price = parsePrice(body.price)

    const bodyStatus = normalizeProductStatus(body.status)
    const shouldPublish =
      body.publish === true ||
      body.isPublished === true ||
      bodyStatus === ProductStatus.PUBLISHED

    const status =
      bodyStatus ||
      (shouldPublish ? ProductStatus.PUBLISHED : ProductStatus.DRAFT)
    const publishedAt = parseDate(body.publishedAt) || (shouldPublish ? new Date() : null)

    const images = parseImages(body.images)
    const gjsComponents = parseJsonValue(body.gjsComponents)
    const gjsStyles = parseJsonValue(body.gjsStyles)

    const data: Prisma.ProductUncheckedCreateInput = {
      name,
      slug,
      excerpt,
      price,
      coverImage,
      status,
      publishedAt,
      gjsHtml: nullableString(body.gjsHtml),
      gjsJs: nullableString(body.gjsJs),
      ...(images !== undefined ? { images } : {}),
      ...(gjsComponents !== undefined ? { gjsComponents } : {}),
      ...(gjsStyles !== undefined ? { gjsStyles } : {}),
      ...(categoryId ? { categoryId } : {}),
      authorId,
    }

    const product = await prisma.product.create({
      data,
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

    return json(
      {
        ok: true,
        message: 'Produit créé avec succès.',
        product: serializeProduct(product),
      },
      201
    )
  } catch (error) {
    console.error('[POST /api/products] Error:', error)

    const details = getErrorMessage(error)

    if (
      details.includes('authorId') ||
      details.includes('Argument `authorId`') ||
      details.includes('Argument authorId')
    ) {
      return json(
        {
          ok: false,
          error:
            "Le produit n'a pas pu être créé car authorId est requis par ton modèle Product. Envoie authorId depuis le front, ou récupère l'utilisateur connecté côté API.",
          details:
            process.env.NODE_ENV === 'development' ? details : undefined,
        },
        400
      )
    }

    if (
      details.includes('Unique constraint') ||
      details.includes('Unique constraint failed')
    ) {
      return json(
        {
          ok: false,
          error: 'Un produit avec ces informations existe déjà.',
          details:
            process.env.NODE_ENV === 'development' ? details : undefined,
        },
        409
      )
    }

    return json(
      {
        ok: false,
        error: 'Impossible de créer le produit.',
        details:
          process.env.NODE_ENV === 'development' ? details : undefined,
      },
      500
    )
  }
}
