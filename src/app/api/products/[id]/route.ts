import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { ProductStatus } from '@/generated/prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/products/[id]
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[GET /api/products/[id]]', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// PATCH /api/products/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      name,
      slug,
      excerpt,
      price,
      coverImage,
      images,
      status,
      publishedAt,
      authorId,
      categoryId,
      gjsComponents,
      gjsStyles,
      gjsHtml,
      gjsJs,
    } = body

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (slug && slug !== existing.slug) {
      const slugUsed = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      })

      if (slugUsed) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 409 }
        )
      }
    }

    if (categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    const nextStatus = (status as ProductStatus | undefined) ?? existing.status

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt: excerpt || null }),
        ...(price !== undefined && {
          price: price !== null && price !== '' ? Number(price) : null,
        }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
        ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
        ...(status !== undefined && { status: nextStatus }),
        ...(publishedAt !== undefined
          ? {
              publishedAt:
                publishedAt === null
                  ? null
                  : new Date(publishedAt)
            }
          : nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED'
          ? { publishedAt: new Date() }
          : {}),
        ...(authorId !== undefined && { authorId }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(gjsComponents !== undefined && { gjsComponents: gjsComponents ?? null }),
        ...(gjsStyles !== undefined && { gjsStyles: gjsStyles ?? null }),
        ...(gjsHtml !== undefined && { gjsHtml: gjsHtml || null }),
        ...(gjsJs !== undefined && { gjsJs: gjsJs || null }),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PATCH /api/products/[id]]', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id]
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/products/[id]]', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}