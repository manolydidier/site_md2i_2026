// src/app/(public)/produits/[slugOrId]/page.tsx

import type { Metadata } from 'next'
import { prisma } from '@/app/lib/prisma'
import { buildMetadata } from '@/app/seo'
import ProductDetailClient from './ProductDetailClient'
import type { Prisma } from '@/generated/prisma/client'

type ProductPageProps = {
  params: Promise<{
    slugOrId: string
  }>
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function decodeIdentifier(value: string) {
  try {
    return decodeURIComponent(value || '').trim()
  } catch {
    return String(value || '').trim()
  }
}

function stripHtml(value?: string | null) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildProductWhere(identifier: string): Prisma.ProductWhereInput {
  return {
    status: 'PUBLISHED',
    publishedAt: {
      not: null,
      lte: new Date(),
    },
    OR: [
      {
        slug: identifier,
      },
      ...(isUuid(identifier)
        ? [
            {
              id: identifier,
            },
          ]
        : []),
    ],
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slugOrId: rawIdentifier } = await params
  const identifier = decodeIdentifier(rawIdentifier)

  if (!identifier) {
    return buildMetadata({
      title: 'Produit introuvable',
      description: 'Cette fiche produit MD2I est introuvable ou non publiée.',
      path: '/produits',
      noIndex: true,
    })
  }

  const product = await prisma.product.findFirst({
    where: buildProductWhere(identifier),
    select: {
      id: true,
      name: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!product) {
    return buildMetadata({
      title: 'Produit introuvable',
      description: 'Cette fiche produit MD2I est introuvable ou non publiée.',
      path: `/produits/${encodeURIComponent(identifier)}`,
      noIndex: true,
    })
  }

  const description =
    stripHtml(product.excerpt).slice(0, 158) ||
    `Découvrez ${product.name}, une solution MD2I pour la gestion, le suivi et l'accompagnement des projets de développement.`

  return buildMetadata({
    title: `${product.name} - solution logicielle MD2I`,
    description,
    path: `/produits/${encodeURIComponent(product.slug || product.id)}`,
    image: product.coverImage || '/logo.png',
    keywords: [
      product.name,
      product.category?.name,
      'fiche produit SARA',
      'logiciel MD2I',
      'démonstration logiciel projet',
    ].filter(Boolean) as string[],
  })
}

export default function Page() {
  return <ProductDetailClient />
}
