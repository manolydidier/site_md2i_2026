import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const slug = (searchParams.get('slug') || '').trim()
    const excludeId = (searchParams.get('excludeId') || '').trim()

    if (!slug) {
      return NextResponse.json(
        { error: 'slug is required', available: false },
        { status: 400 }
      )
    }

    const existing = await prisma.product.findFirst({
      where: excludeId
        ? {
            slug,
            NOT: { id: excludeId },
          }
        : { slug },
      select: { id: true },
    })

    return NextResponse.json({
      available: !existing,
    })
  } catch (error) {
    console.error('[GET /api/products/check-slug]', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        available: false,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}