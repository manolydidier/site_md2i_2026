import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOW_PUBLIC_PRODUCT_SCRIPTS =
  process.env.NODE_ENV !== 'production' ||
  process.env.ALLOW_PUBLIC_PRODUCT_SCRIPTS === 'true'

function toSerializableNumber(value: unknown): number | null {
  if (value == null) return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value === 'object') {
    const record = value as {
      toNumber?: () => number
      toString?: () => string
    }

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

function toIsoDate(value: unknown): string | null {
  if (!value) return null

  try {
    const d = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

function decodeIdentifier(value?: string | null) {
  try {
    return decodeURIComponent(value ?? '').trim()
  } catch {
    return String(value ?? '').trim()
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  excerpt: true,
  price: true,
  coverImage: true,
  images: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  gjsComponents: true,
  gjsStyles: true,
  gjsHtml: true,
  gjsJs: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect

type PublicProduct = Prisma.ProductGetPayload<{
  select: typeof publicProductSelect
}>

function serializeProduct(product: PublicProduct) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    excerpt: product.excerpt ?? null,
    price: toSerializableNumber(product.price),
    coverImage: product.coverImage ?? null,
    images: product.images ?? null,
    publishedAt: toIsoDate(product.publishedAt),
    createdAt: toIsoDate(product.createdAt),
    updatedAt: toIsoDate(product.updatedAt),
    gjsComponents: product.gjsComponents ?? null,
    gjsStyles: product.gjsStyles ?? null,
    gjsHtml: product.gjsHtml ?? null,
    gjsJs: ALLOW_PUBLIC_PRODUCT_SCRIPTS ? product.gjsJs ?? null : null,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug ?? null,
        }
      : null,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId: rawSlugOrId } = await params
    const slugOrId = decodeIdentifier(rawSlugOrId)

    if (!slugOrId) {
      return NextResponse.json(
        { error: 'Identifiant produit invalide.' },
        { status: 400 }
      )
    }

    const now = new Date()

    let product = await prisma.product.findFirst({
      where: {
        status: 'PUBLISHED',
        slug: {
          equals: slugOrId,
          mode: 'insensitive',
        },
        publishedAt: {
          not: null,
          lte: now,
        },
      },
      select: publicProductSelect,
    })

    if (!product && isUuid(slugOrId)) {
      product = await prisma.product.findFirst({
        where: {
          status: 'PUBLISHED',
          id: slugOrId,
          publishedAt: {
            not: null,
            lte: now,
          },
        },
        select: publicProductSelect,
      })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable.' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeProduct(product))
  } catch (error) {
    console.error('GET /api/products/public/[slugOrId] failed:', error)

    return NextResponse.json(
      {
        error: 'Impossible de charger ce produit public.',
        details:
          error instanceof Error
            ? error.message
            : 'Erreur serveur inconnue',
      },
      { status: 500 }
    )
  }
}
