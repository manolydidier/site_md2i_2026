import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

type ReferenceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

function serializeReference(reference: any) {
  return {
    id: reference.id,
    country: reference.country,
    code: reference.code,
    lat: Number(reference.lat),
    lng: Number(reference.lng),
    title: reference.title,
    slug: reference.slug,
    excerpt: reference.excerpt || '',
    image: reference.image?.trim() || '/placeholder-reference.svg',
    details: reference.details || '',
    date: reference.date,
    client: reference.client,
    category: reference.category,
    tags: Array.isArray(reference.tags) ? reference.tags : [],
    impact: reference.impact || '',
    technologies: Array.isArray(reference.technologies)
      ? reference.technologies
      : [],
    team: reference.team || '',
    duration: reference.duration || '',
    budget: reference.budget || '',
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''
    const year = searchParams.get('year')?.trim() || ''
    const technology = searchParams.get('technology')?.trim() || ''
    const tag = searchParams.get('tag')?.trim() || ''
    const sortBy = searchParams.get('sortBy') || 'date'

    const where: any = {
      status: 'PUBLISHED' satisfies ReferenceStatus,
    }

    if (category) {
      where.category = category
    }

    if (year) {
      where.date = year
    }

    if (technology) {
      where.technologies = { has: technology }
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { technologies: { has: search } },
      ]
    }

    const rawReferences = await prisma.reference.findMany({
      where,
      orderBy:
        sortBy === 'client'
          ? { client: 'asc' }
          : sortBy === 'createdAt'
          ? { createdAt: 'desc' }
          : { date: 'desc' },
    })

    const references = rawReferences.map(serializeReference)

    return NextResponse.json({
      data: references,
      total: references.length,
    })
  } catch (error) {
    console.error('[GET /api/public/references] Error:', error)

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}