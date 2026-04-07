import prisma from '@/app/lib/prisma'

export type ServiceSort = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

export function normalizeServiceSort(value?: string): ServiceSort {
  if (value === 'date-asc') return 'date-asc'
  if (value === 'title-asc') return 'title-asc'
  if (value === 'title-desc') return 'title-desc'
  return 'date-desc'
}

function getOrderBy(sort: ServiceSort) {
  switch (sort) {
    case 'date-asc':
      return [{ publishedAt: 'asc' }, { createdAt: 'asc' }] as const
    case 'title-asc':
      return [{ name: 'asc' }] as const
    case 'title-desc':
      return [{ name: 'desc' }] as const
    case 'date-desc':
    default:
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }] as const
  }
}

function getWhere(search?: string, categorySlug?: string) {
  const q = search?.trim()

  return {
    status: 'PUBLISHED' as const,
    ...(categorySlug
      ? {
          category: {
            is: { slug: categorySlug },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { excerpt: { contains: q, mode: 'insensitive' as const } },
            {
              category: {
                is: {
                  name: { contains: q, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {}),
  }
}

export async function getPublicServiceCategories() {
  const categories = await prisma.productCategory.findMany({
    orderBy: { name: 'asc' },
    include: {
      products: {
        where: { status: 'PUBLISHED' },
        select: { id: true },
      },
    },
  })

  return categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      count: cat.products.length,
    }))
    .filter((cat) => cat.count > 0)
}

export async function getPublicServices({
  page = 1,
  limit = 9,
  search,
  category,
  sort = 'date-desc',
}: {
  page?: number
  limit?: number
  search?: string
  category?: string
  sort?: ServiceSort
}) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(50, limit))
  const skip = (safePage - 1) * safeLimit
  const where = getWhere(search, category)

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: getOrderBy(sort),
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
  ])

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  }
}

export async function getPublicServiceBySlug(slug: string) {
  return prisma.product.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      category: true,
    },
  })
}

export async function getPublicServiceCategoryBySlug(slug: string) {
  return prisma.productCategory.findUnique({
    where: { slug },
  })
}