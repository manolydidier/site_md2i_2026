import { NextRequest, NextResponse } from 'next/server'
import * as prismaModule from '@/app/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = ((prismaModule as any).default ??
  (prismaModule as any).prisma ??
  prismaModule) as {
  product: {
    findFirst: (args: any) => Promise<any>
  }
}

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
    const d = value instanceof Date ? value : new Date(value as any)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

function serializeProduct(product: any) {
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
    gjsJs: product.gjsJs ?? null,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug ?? null,
        }
      : null,
  }
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
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId: rawSlugOrId } = await params
    const slugOrId = decodeURIComponent(rawSlugOrId ?? '').trim()

    if (!slugOrId) {
      return NextResponse.json(
        { error: 'Identifiant produit invalide.' },
        { status: 400 }
      )
    }

    const now = new Date()

    let product: any = null

    product = await prisma.product.findFirst({
      where: {
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

    if (!product) {
      product = await prisma.product.findFirst({
        where: {
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