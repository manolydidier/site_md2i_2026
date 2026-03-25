// app/api/articles/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(10, parseInt(searchParams.get('limit') ?? '5'))

  try {
    const [articles, total] = await Promise.all([
      prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count(),
    ])

    return Response.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}