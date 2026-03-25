import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'

// ─── GET /api/permission-resources ─────────────────────────────────────────────
// Liste toutes les ressources disponibles (pour le formulaire d'ajout de permission)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canList' })
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))

  try {
    const resources = await prisma.permissionResource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    })

    const total = await prisma.permissionResource.count({
      where: { isActive: true },
    })

    return Response.json({
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources :', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: 'Erreur serveur', details: errorMessage }, { status: 500 })
  }
}