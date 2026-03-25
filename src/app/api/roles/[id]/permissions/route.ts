import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'

const PERMISSION_SELECT = {
  id: true,
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canList: true,
  canExport: true,
  canApprove: true,
  canManage: true,
  specialPermission: true,
  createdAt: true,
  resource: {
    select: { id: true, name: true, code: true, description: true },
  },
} as const

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canList', resource: 'permissions' })
  if (!guard.ok) return guard.response

  const { id: roleId } = await context.params

  console.log('[GET permissions] roleId:', roleId)

  const role = await prisma.role.findFirst({
    where: { id: roleId },
    select: { id: true, name: true, code: true, isSystem: true },
  })
  if (!role) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })

  const permissions = await prisma.rolePermission.findMany({
    where: { roleId },
    select: PERMISSION_SELECT,
    orderBy: { resource: { name: 'asc' } },
  })

  return Response.json({ role, data: permissions })
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canCreate', resource: 'permissions' })
  if (!guard.ok) return guard.response

  const { id: roleId } = await context.params

  const role = await prisma.role.findFirst({ where: { id: roleId } })
  if (!role) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })

  const body = await req.json()
  const {
    resourceId,
    canRead = false, canCreate = false, canUpdate = false, canDelete = false,
    canList = false, canExport = false, canApprove = false, canManage = false,
    specialPermission = 'NONE',
  } = body

  if (!resourceId) return Response.json({ error: 'resourceId est requis' }, { status: 400 })

  const resource = await prisma.permissionResource.findFirst({
    where: { id: resourceId, isActive: true },
  })
  if (!resource) return Response.json({ error: 'Ressource introuvable ou inactive' }, { status: 404 })

  const existing = await prisma.rolePermission.findFirst({
    where: { roleId, resourceId },
  })
  if (existing) {
    return Response.json(
      { error: 'Une permission existe déjà pour ce rôle et cette ressource' },
      { status: 409 }
    )
  }

  const permission = await prisma.rolePermission.create({
    data: {
      roleId, resourceId,
      canRead, canCreate, canUpdate, canDelete,
      canList, canExport, canApprove, canManage,
      specialPermission,
    },
    select: PERMISSION_SELECT,
  })

  return Response.json(permission, { status: 201 })
}