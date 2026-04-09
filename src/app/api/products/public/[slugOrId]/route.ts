import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import * as prismaModule from '@/app/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = ((prismaModule as any).default ??
  (prismaModule as any).prisma ??
  prismaModule) as {
  product: any
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

function serializeProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    excerpt: product.excerpt ?? null,
    price: toSerializableNumber(product.price),
    coverImage: product.coverImage ?? null,
    images: product.images ?? null,
    publishedAt: product.publishedAt ? new Date(product.publishedAt).toISOString() : null,
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
    updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : null,
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slugOrId: string }> }
) {
  try {
    const { slugOrId: rawSlugOrId } = await params
    const slugOrId = decodeURIComponent(rawSlugOrId ?? '').trim()

    if (!slugOrId) {
      return NextResponse.json({ error: 'Identifiant produit invalide.' }, { status: 400 })
    }

    const where: Prisma.ProductWhereInput = {
      AND: [
        { publishedAt: { not: null } },
        {
          OR: [
            { slug: { equals: slugOrId, mode: 'insensitive' } },
            { id: slugOrId },
          ],
        },
      ],
    }

    const product = await prisma.product.findFirst({
      where,
      select: {
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
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
    }

    return NextResponse.json(serializeProduct(product))
  } catch (error) {
    console.error('GET /api/products/public/[slugOrId] failed:', error)

    return NextResponse.json(
      { error: 'Impossible de charger ce produit public.' },
      { status: 500 }
    )
  }
}