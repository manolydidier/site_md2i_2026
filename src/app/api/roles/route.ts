// app/api/roles/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'

// ── GET /api/roles — liste paginée + recherche + tri ─────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, parseInt(searchParams.get('page')   ?? '1'))
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
  const search  = searchParams.get('search')  ?? ''
  const sortBy  = searchParams.get('sortBy')  ?? 'createdAt'
  const sortDir = searchParams.get('sortDir') ?? 'desc'

  const where: any = {
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { code:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { [sortBy]: sortDir },
      select: {
        id: true, name: true, code: true,
        description: true, isSystem: true,
        createdAt: true, updatedAt: true,
        rolePermissions: {
          select: {
            id: true,
            canRead: true, canCreate: true, canUpdate: true,
            canDelete: true, canList: true, canExport: true,
            canApprove: true, canManage: true, specialPermission: true,
            resource: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { userRoles: true } },
      },
    }),
    prisma.role.count({ where }),
  ])

  return Response.json({
    data:       roles,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// ── POST /api/roles — créer un rôle ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { name, code, description } = await req.json()

  if (!name || !code) {
    return Response.json({ error: 'Nom et code requis' }, { status: 400 })
  }

  const existing = await prisma.role.findFirst({
    where: { OR: [{ name }, { code }] },
  })
  if (existing) {
    return Response.json({ error: 'Un rôle avec ce nom ou code existe déjà' }, { status: 400 })
  }

  const role = await prisma.role.create({
    data: { name, code: code.toUpperCase(), description },
    select: { id: true, name: true, code: true, description: true, isSystem: true, createdAt: true },
  })

  return Response.json(role, { status: 201 })
}