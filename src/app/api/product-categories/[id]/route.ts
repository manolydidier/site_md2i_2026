import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
})

type Params = { params: { id: string } }

// ── GET /api/product-categories/:id ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const category = await prisma.productCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { products: true } },
        products: {
          where:   { status: 'PUBLISHED' },
          take:    6,
          orderBy: { publishedAt: 'desc' },
          select:  { id: true, name: true, slug: true, coverImage: true, price: true, status: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('[GET /api/product-categories/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH /api/product-categories/:id ───────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    // Check slug uniqueness if being changed
    if (parsed.data.slug) {
      const conflict = await prisma.productCategory.findFirst({
        where: { slug: parsed.data.slug, NOT: { id: params.id } },
      })
      if (conflict) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
    }

    const category = await prisma.productCategory.update({
      where: { id: params.id },
      data:  parsed.data,
    })

    return NextResponse.json({ data: category })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('[PATCH /api/product-categories/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE /api/product-categories/:id ──────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    // Reassign linked products to null before deleting
    await prisma.product.updateMany({
      where: { categoryId: params.id },
      data:  { categoryId: null },
    })

    await prisma.productCategory.delete({ where: { id: params.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    console.error('[DELETE /api/product-categories/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}