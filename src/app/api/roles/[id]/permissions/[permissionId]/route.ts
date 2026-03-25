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
  resource: { select: { id: true, name: true, code: true } },
} as const

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; permissionId: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canUpdate', resource: 'permissions' })
  if (!guard.ok) return guard.response

  const { id: roleId, permissionId } = await context.params

  const existing = await prisma.rolePermission.findFirst({
    where: { id: permissionId, roleId },
  })
  if (!existing) return Response.json({ error: 'Permission introuvable' }, { status: 404 })

  const body = await req.json()
  const ALLOWED = [
    'canRead', 'canCreate', 'canUpdate', 'canDelete',
    'canList', 'canExport', 'canApprove', 'canManage',
    'specialPermission',
  ]
  const data: Record<string, unknown> = {}
  for (const field of ALLOWED) {
    if (field in body) data[field] = body[field]
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide' }, { status: 400 })
  }

  const updated = await prisma.rolePermission.update({
    where: { id: permissionId },
    data,
    select: PERMISSION_SELECT,
  })

  return Response.json(updated)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; permissionId: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canDelete', resource: 'permissions' })
  if (!guard.ok) return guard.response

  const { id: roleId, permissionId } = await context.params

  const existing = await prisma.rolePermission.findFirst({
    where: { id: permissionId, roleId },
  })
  if (!existing) return Response.json({ error: 'Permission introuvable' }, { status: 404 })

  await prisma.rolePermission.delete({ where: { id: permissionId } })

  return Response.json({ success: true })
}