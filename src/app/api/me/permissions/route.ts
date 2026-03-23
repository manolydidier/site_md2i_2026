// app/api/me/permissions/route.ts
// Retourne toutes les permissions de l'utilisateur connecté
// Appelé une fois au chargement de l'app, résultat mis en cache côté client

import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const roleId = session.user.roleId

  if (!roleId) {
    // Pas de rôle → aucune permission
    return Response.json({ permissions: [], role: null })
  }

  // Charger les permissions du rôle depuis la DB
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      resource: { select: { code: true, name: true } },
    },
  })

  // Aplatir en tableau "resource.action"
  const permissions: string[] = rolePermissions.flatMap(rp => {
    const res     = rp.resource.code
    const actions: string[] = []

    if (rp.canRead)    actions.push(`${res}.canRead`)
    if (rp.canCreate)  actions.push(`${res}.canCreate`)
    if (rp.canUpdate)  actions.push(`${res}.canUpdate`)
    if (rp.canDelete)  actions.push(`${res}.canDelete`)
    if (rp.canList)    actions.push(`${res}.canList`)
    if (rp.canExport)  actions.push(`${res}.canExport`)
    if (rp.canApprove) actions.push(`${res}.canApprove`)
    if (rp.canManage)  actions.push(`${res}.canManage`)
    if (rp.specialPermission === 'FULL_ACCESS') {
      actions.push(`${res}.FULL_ACCESS`)
    }

    return actions
  })

  return Response.json({
    permissions,
    role: {
      id:   session.user.roleId,
      name: session.user.role,
      code: session.user.roleCode,
    },
    // Format détaillé si besoin
    detail: rolePermissions.map(rp => ({
      resource:          rp.resource.code,
      resourceName:      rp.resource.name,
      canRead:           rp.canRead,
      canCreate:         rp.canCreate,
      canUpdate:         rp.canUpdate,
      canDelete:         rp.canDelete,
      canList:           rp.canList,
      canExport:         rp.canExport,
      canApprove:        rp.canApprove,
      canManage:         rp.canManage,
      specialPermission: rp.specialPermission,
    })),
  })
}