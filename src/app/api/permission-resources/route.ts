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
  const limit   = Math.min(200, parseInt(searchParams.get('limit') ?? '20'))
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const search  = (searchParams.get('search') ?? '').trim()

  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  try {
    const resources = await prisma.permissionResource.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        description: true,
        isActive: true,
        _count: { select: { rolePermissions: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const total = await prisma.permissionResource.count({ where })

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

// ─── POST /api/permission-resources ────────────────────────────────────────────
// Enregistre un nouveau module/table dans le catalogue de permissions. Dès la
// création, la ressource apparaît dans la matrice de permissions de chaque
// rôle — aucune autre modification de code n'est nécessaire pour l'exposer.
function slugifyCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { resource: 'permissions', action: 'canCreate' })
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null
  const description = typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  const code = slugifyCode(typeof body.code === 'string' && body.code.trim() ? body.code : name)

  if (!name) return Response.json({ error: 'Le nom est requis' }, { status: 400 })
  if (!code)  return Response.json({ error: 'Le code est requis' }, { status: 400 })

  const existing = await prisma.permissionResource.findFirst({
    where: { OR: [{ code }, { name }] },
  })
  if (existing) {
    return Response.json({ error: 'Une ressource avec ce nom ou ce code existe déjà' }, { status: 409 })
  }

  const resource = await prisma.permissionResource.create({
    data: { name, code, category, description, isActive: true },
    select: { id: true, name: true, code: true, category: true, description: true, isActive: true, createdAt: true },
  })

  return Response.json(resource, { status: 201 })
}