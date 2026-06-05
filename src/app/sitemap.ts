import type { MetadataRoute } from 'next'
import { prisma } from './lib/prisma'
import { SITE_URL } from './seo'

const staticRoutes = [
  { path: '/', priority: 1 },
  { path: '/produits', priority: 0.95 },
  { path: '/articles', priority: 0.92 },
  { path: '/services', priority: 0.9 },
  { path: '/reference', priority: 0.8 },
  { path: '/a-propos', priority: 0.72 },
  { path: '/contact', priority: 0.7 },
  { path: '/contact-commercial', priority: 0.7 },
]

type SitemapEntry = MetadataRoute.Sitemap[number]

function entry({
  path,
  priority,
  lastModified,
  changeFrequency = 'monthly',
}: {
  path: string
  priority: number
  lastModified: Date
  changeFrequency?: SitemapEntry['changeFrequency']
}): SitemapEntry {
  return {
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }
}

async function getDynamicRoutes(now: Date): Promise<SitemapEntry[]> {
  try {
    const [products, posts, references] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            not: null,
            lte: now,
          },
        },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
      prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            not: null,
            lte: now,
          },
        },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
      prisma.reference.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
    ])

    return [
      ...products.map((product) =>
        entry({
          path: `/produits/${encodeURIComponent(product.slug || product.id)}`,
          priority: 0.86,
          lastModified: product.updatedAt || product.publishedAt || now,
        }),
      ),
      ...posts.map((post) =>
        entry({
          path: `/articles/${encodeURIComponent(post.slug || post.id)}`,
          priority: 0.78,
          lastModified: post.updatedAt || post.publishedAt || now,
        }),
      ),
      ...references.map((reference) =>
        entry({
          path: `/reference/${encodeURIComponent(reference.slug)}`,
          priority: 0.76,
          lastModified: reference.updatedAt || reference.publishedAt || now,
        }),
      ),
    ]
  } catch (error) {
    console.error('[sitemap] Dynamic public routes unavailable:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries = staticRoutes.map((route) =>
    entry({
      path: route.path,
      lastModified,
      changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
      priority: route.priority,
    }),
  )

  return [...staticEntries, ...(await getDynamicRoutes(lastModified))]
}
