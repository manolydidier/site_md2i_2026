import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { z } from 'zod'

// ── Validation schemas ──────────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
})

// ── GET /api/product-categories ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? ''

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.productCategory.count({ where }),
    ])

    return NextResponse.json({
      data: categories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/product-categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/product-categories ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const existing = await prisma.productCategory.findUnique({
      where: { slug: parsed.data.slug },
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }

    const category = await prisma.productCategory.create({ data: parsed.data })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/product-categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}