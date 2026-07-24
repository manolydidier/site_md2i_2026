import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'
import { logAudit } from '@/(permisionGuard)/lib/audit'

const RESOURCE_SELECT = {
  id: true,
  name: true,
  code: true,
  category: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { rolePermissions: true } },
} as const

// ─── GET /api/permission-resources/:id ─────────────────────────────────────────
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { resource: 'permissions', action: 'canRead' })
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const resource = await prisma.permissionResource.findUnique({ where: { id }, select: RESOURCE_SELECT })
  if (!resource) return Response.json({ error: 'Ressource introuvable' }, { status: 404 })

  return Response.json(resource)
}

// ─── PATCH /api/permission-resources/:id ───────────────────────────────────────
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { resource: 'permissions', action: 'canUpdate' })
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const existing = await prisma.permissionResource.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Ressource introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body.description === 'string') data.description = body.description.trim() || null
  if (typeof body.category === 'string') data.category = body.category.trim() || null
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucune modification fournie' }, { status: 400 })
  }

  if (data.name && data.name !== existing.name) {
    const clash = await prisma.permissionResource.findFirst({ where: { name: data.name as string, id: { not: id } } })
    if (clash) return Response.json({ error: 'Une autre ressource porte déjà ce nom' }, { status: 409 })
  }

  const resource = await prisma.permissionResource.update({ where: { id }, data, select: RESOURCE_SELECT })

  await logAudit({
    actorId: session.user.id,
    action: 'update',
    entity: 'permission_resource',
    entityId: id,
    metadata: data,
    req,
  })

  return Response.json(resource)
}

// ─── DELETE /api/permission-resources/:id ──────────────────────────────────────
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { resource: 'permissions', action: 'canDelete' })
  if (!guard.ok) return guard.response

  const { id } = await context.params
  const existing = await prisma.permissionResource.findUnique({
    where: { id },
    select: { id: true, _count: { select: { rolePermissions: true } } },
  })
  if (!existing) return Response.json({ error: 'Ressource introuvable' }, { status: 404 })

  if (existing._count.rolePermissions > 0) {
    return Response.json(
      {
        error: 'Cette ressource est utilisée par des permissions de rôle existantes — désactivez-la plutôt que de la supprimer',
        code: 'RESOURCE_IN_USE',
      },
      { status: 409 }
    )
  }

  await prisma.permissionResource.delete({ where: { id } })

  await logAudit({
    actorId: session.user.id,
    action: 'delete',
    entity: 'permission_resource',
    entityId: id,
    req,
  })

  return Response.json({ success: true })
}
