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
  resource: {
    select: { id: true, name: true, code: true },
  },
} as const

// ─── PATCH /api/roles/[roleId]/permissions/[permissionId] ──────────────────────
// Modifie une ou plusieurs valeurs d'une permission existante
// Supporte la mise à jour partielle (seuls les champs envoyés sont modifiés)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { roleId: string; permissionId: string } }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canUpdate' })
  if (!guard.ok) return guard.response

  const { roleId, permissionId } = params

  // Vérifier que la permission appartient bien à ce rôle
  const existing = await prisma.rolePermission.findFirst({
    where: { id: permissionId, roleId },
  })
  if (!existing) {
    return Response.json({ error: 'Permission introuvable' }, { status: 404 })
  }

  const body = await req.json()

  // Mise à jour partielle : on ne touche qu'aux champs présents dans le body
  const allowedFields = [
    'canRead', 'canCreate', 'canUpdate', 'canDelete',
    'canList', 'canExport', 'canApprove', 'canManage',
    'specialPermission',
  ]
  const data: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field]
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 })
  }

  const updated = await prisma.rolePermission.update({
    where: { id: permissionId },
    data,
    select: PERMISSION_SELECT,
  })

  return Response.json(updated)
}

// ─── DELETE /api/roles/[roleId]/permissions/[permissionId] ─────────────────────
// Supprime une permission d'un rôle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roleId: string; permissionId: string } }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canDelete' })
  if (!guard.ok) return guard.response

  const { roleId, permissionId } = params

  // Vérifier que la permission appartient bien à ce rôle
  const existing = await prisma.rolePermission.findFirst({
    where: { id: permissionId, roleId },
  })
  if (!existing) {
    return Response.json({ error: 'Permission introuvable' }, { status: 404 })
  }

  await prisma.rolePermission.delete({ where: { id: permissionId } })

  return Response.json({ success: true })
}