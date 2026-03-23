// app/api/roles/[id]/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'

// ── GET /api/roles/[id] — détail + utilisateurs assignés ─────────────────────
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
   const { id } = await params
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const role = await prisma.role.findFirst({
    where: { id: id },
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
      userRoles: {
        take: 50,
        orderBy: { assignedAt: 'desc' },
        select: {
          assignedAt: true,
          user: {
            select: {
              id: true, email: true,
              firstName: true, lastName: true,
              avatarUrl: true, status: true,
            },
          },
        },
      },
      _count: { select: { userRoles: true } },
    },
  })

  if (!role) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })
  return Response.json(role)
}

// ── PATCH /api/roles/[id] — modifier ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const { id } = await params
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const existing = await prisma.role.findUnique({ where: { id: id } })
  if (!existing) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })
  if (existing.isSystem) return Response.json({ error: 'Les rôles système ne peuvent pas être modifiés' }, { status: 403 })

  const { name, code, description } = await req.json()

  const conflict = await prisma.role.findFirst({
    where: {
      AND: [
        { id: { not: params.id } },
        { OR: [{ name }, { code }] },
      ],
    },
  })
  if (conflict) return Response.json({ error: 'Nom ou code déjà utilisé' }, { status: 400 })

  const role = await prisma.role.update({
    where: { id: params.id },
    data: {
      ...(name        && { name }),
      ...(code        && { code: code.toUpperCase() }),
      ...(description !== undefined && { description }),
    },
    select: { id: true, name: true, code: true, description: true, isSystem: true, updatedAt: true },
  })

  return Response.json(role)
}

// ── DELETE /api/roles/[id] — supprimer ────────────────────────────────────────
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const { id } = await params
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const existing = await prisma.role.findFirst({
    where: { id: id },
    include: { _count: { select: { userRoles: true } } },
  })
  if (!existing) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })
  if (existing.isSystem) return Response.json({ error: 'Les rôles système ne peuvent pas être supprimés' }, { status: 403 })
  if (existing._count.userRoles > 0) {
    return Response.json({
      error: `Ce rôle est assigné à ${existing._count.userRoles} utilisateur(s). Retirez-le d'abord.`,
    }, { status: 400 })
  }

  await prisma.role.delete({ where: { id: id } })
  return Response.json({ success: true })
}