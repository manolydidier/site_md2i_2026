import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'

const ACTION_FIELDS = [
  'canRead', 'canCreate', 'canUpdate', 'canDelete',
  'canList', 'canExport', 'canApprove', 'canManage',
  'canImport', 'canPrint', 'canValidate', 'canCancel',
  'canArchive', 'canRestore', 'canDownload', 'canUpload', 'canExecute',
] as const

const PERMISSION_SELECT = {
  id: true,
  ...Object.fromEntries(ACTION_FIELDS.map(f => [f, true])),
  specialPermission: true,
  resource: { select: { id: true, name: true, code: true, category: true } },
} as const

type BulkItem = { resourceId: string; specialPermission?: 'NONE' | 'FULL_ACCESS' } & Partial<Record<typeof ACTION_FIELDS[number], boolean>>

// ─── PUT /api/roles/:id/permissions/bulk ───────────────────────────────────────
// Applique en une seule transaction plusieurs mises à jour de permissions
// (upsert par ressource) — utilisé par la matrice de permissions pour la
// sélection "tout cocher / tout décocher" (par ligne ou globale).
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canUpdate', resource: 'permissions' })
  if (!guard.ok) return guard.response

  const { id: roleId } = await context.params
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const items: BulkItem[] = Array.isArray(body?.items) ? body.items : []
  if (!items.length) return Response.json({ error: 'items est requis (tableau non vide)' }, { status: 400 })

  const resourceIds = items.map(i => i.resourceId)
  const validResources = await prisma.permissionResource.findMany({
    where: { id: { in: resourceIds }, isActive: true },
    select: { id: true },
  })
  const validIds = new Set(validResources.map(r => r.id))

  const results = await prisma.$transaction(
    items
      .filter(item => validIds.has(item.resourceId))
      .map(item => {
        const { resourceId, ...rest } = item
        const data: Record<string, boolean | 'NONE' | 'FULL_ACCESS'> = {}
        for (const field of ACTION_FIELDS) {
          if (field in rest) data[field] = rest[field]!
        }
        if (rest.specialPermission) data.specialPermission = rest.specialPermission

        return prisma.rolePermission.upsert({
          where: { roleId_resourceId: { roleId, resourceId } },
          update: data,
          create: { roleId, resourceId, ...data },
          select: PERMISSION_SELECT,
        })
      })
  )

  return Response.json({ data: results })
}
