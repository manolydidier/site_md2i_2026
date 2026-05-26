import { prisma } from '@/app/lib/prisma'

export type SearchCategory = 'products' | 'articles' | 'references' | 'links'

export type SearchScope = 'all' | SearchCategory

export type SearchResult = {
  id: string
  category: SearchCategory
  title: string
  description?: string | null
  href: string
  image?: string | null
  meta?: string | null
}

export type SearchResponse = {
  query: string
  scope: SearchScope
  results: Record<SearchCategory, SearchResult[]>
  suggestions: string[]
  total: number
}

const STATIC_LINKS: SearchResult[] = [
  {
    id: 'link-home',
    category: 'links',
    title: 'Accueil',
    description: 'Page d’accueil',
    href: '/',
  },
  {
    id: 'link-services',
    category: 'links',
    title: 'Services',
    description: 'Découvrir nos services',
    href: '/services',
  },
  {
    id: 'link-products',
    category: 'links',
    title: 'Produits',
    description: 'Catalogue des produits',
    href: '/produits',
  },
  {
    id: 'link-references',
    category: 'links',
    title: 'Références',
    description: 'Réalisations et projets',
    href: '/reference',
  },
  {
    id: 'link-about',
    category: 'links',
    title: 'À propos',
    description: 'Informations sur MD2I',
    href: '/a-propos',
  },
  {
    id: 'link-contact',
    category: 'links',
    title: 'Contact',
    description: 'Nous contacter',
    href: '/contact',
  },
  {
    id: 'link-contact-commercial',
    category: 'links',
    title: 'Contact commercial',
    description: 'Contacter l’équipe commerciale',
    href: '/contact-commercial',
  },
]

function normalizeScope(scope?: string | null): SearchScope {
  if (
    scope === 'products' ||
    scope === 'articles' ||
    scope === 'references' ||
    scope === 'links'
  ) {
    return scope
  }

  return 'all'
}

function shouldSearch(scope: SearchScope, category: SearchCategory) {
  return scope === 'all' || scope === category
}

function cleanQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ')
}

function includesQuery(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false
}

function uniqueByHref(results: SearchResult[]) {
  const map = new Map<string, SearchResult>()

  for (const result of results) {
    if (!map.has(result.href)) {
      map.set(result.href, result)
    }
  }

  return Array.from(map.values())
}

function pageHref(slug: string) {
  const cleanSlug = slug.replace(/^\/+/, '')

  if (cleanSlug === 'home' || cleanSlug === 'accueil') {
    return '/'
  }

  return `/${cleanSlug}`
}

function emptySearchResponse(query: string, scope: SearchScope): SearchResponse {
  return {
    query,
    scope,
    results: {
      products: [],
      articles: [],
      references: [],
      links: [],
    },
    suggestions: [],
    total: 0,
  }
}

export async function searchSite({
  query,
  scope,
  limit = 6,
}: {
  query: string
  scope?: string | null
  limit?: number
}): Promise<SearchResponse> {
  const q = cleanQuery(query)
  const searchScope = normalizeScope(scope)
  const safeLimit = Math.min(Math.max(limit, 1), 20)

  if (q.length < 2) {
    return emptySearchResponse(q, searchScope)
  }

  const textFilter = {
    contains: q,
    mode: 'insensitive' as const,
  }

  const [products, posts, references, pages] = await Promise.all([
    shouldSearch(searchScope, 'products')
      ? prisma.product.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { name: textFilter },
              { slug: textFilter },
              { excerpt: textFilter },
              {
                category: {
                  name: textFilter,
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            excerpt: true,
            price: true,
            coverImage: true,
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
          take: safeLimit,
        })
      : Promise.resolve([]),

    shouldSearch(searchScope, 'articles')
      ? prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: textFilter },
              { slug: textFilter },
              { excerpt: textFilter },
              {
                category: {
                  name: textFilter,
                },
              },
              {
                tags: {
                  some: {
                    tag: {
                      name: textFilter,
                    },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
          take: safeLimit,
        })
      : Promise.resolve([]),

    shouldSearch(searchScope, 'references')
      ? prisma.reference.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: textFilter },
              { slug: textFilter },
              { excerpt: textFilter },
              { details: textFilter },
              { client: textFilter },
              { country: textFilter },
              { category: textFilter },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            image: true,
            client: true,
            country: true,
            category: true,
          },
          orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
          take: safeLimit,
        })
      : Promise.resolve([]),

    shouldSearch(searchScope, 'links')
      ? prisma.page.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: textFilter },
              { slug: textFilter },
              { description: textFilter },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: safeLimit,
        })
      : Promise.resolve([]),
  ])

  const productResults: SearchResult[] = products.map((product) => ({
    id: product.id,
    category: 'products',
    title: product.name,
    description: product.excerpt,
    href: `/produits/${product.slug}`,
    image: product.coverImage,
    meta: product.category?.name ?? product.price?.toString() ?? null,
  }))

  const articleResults: SearchResult[] = posts.map((post) => ({
    id: post.id,
    category: 'articles',
    title: post.title,
    description: post.excerpt,
    href: `/articles/${post.id}`,
    image: post.coverImage,
    meta: post.category?.name ?? null,
  }))

  const referenceResults: SearchResult[] = references.map((reference) => ({
    id: reference.id,
    category: 'references',
    title: reference.title,
    description: reference.excerpt,
    href: `/reference/${reference.slug}`,
    image: reference.image,
    meta: [reference.client, reference.country, reference.category]
      .filter(Boolean)
      .join(' · '),
  }))

  const pageResults: SearchResult[] = pages.map((page) => ({
    id: page.id,
    category: 'links',
    title: page.title,
    description: page.description,
    href: pageHref(page.slug),
  }))

  const staticLinkResults =
    shouldSearch(searchScope, 'links')
      ? STATIC_LINKS.filter((link) => {
          return (
            includesQuery(link.title, q) ||
            includesQuery(link.description, q) ||
            includesQuery(link.href, q)
          )
        }).slice(0, safeLimit)
      : []

  const results = {
    products: productResults,
    articles: articleResults,
    references: referenceResults,
    links: uniqueByHref([...staticLinkResults, ...pageResults]).slice(
      0,
      safeLimit
    ),
  }

  const flatResults = [
    ...results.products,
    ...results.articles,
    ...results.references,
    ...results.links,
  ]

  const suggestions = Array.from(
    new Set(flatResults.map((item) => item.title))
  ).slice(0, 8)

  return {
    query: q,
    scope: searchScope,
    results,
    suggestions,
    total: flatResults.length,
  }
}