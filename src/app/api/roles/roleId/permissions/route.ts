import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/app/lib/prisma'
import { withPermission } from '@/(permisionGuard)/lib/permissions'

// ─── Sélection commune ──────────────────────────────────────────────────────────
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

// ─── GET /api/roles/[roleId]/permissions ────────────────────────────────────────
// Récupère toutes les permissions d'un rôle
export async function GET(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canList' })
  if (!guard.ok) return guard.response

  const { roleId } = params

  // Vérifier que le rôle existe
  const role = await prisma.role.findUnique({
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

// ─── POST /api/roles/[roleId]/permissions ───────────────────────────────────────
// Crée une nouvelle permission pour un rôle sur une ressource
export async function POST(
  req: NextRequest,
  { params }: { params: { roleId: string } }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const guard = await withPermission(req, { action: 'canCreate' })
  if (!guard.ok) return guard.response

  const { roleId } = params

  // Vérifier que le rôle existe
  const role = await prisma.role.findUnique({ where: { id: roleId } })
  if (!role) return Response.json({ error: 'Rôle introuvable' }, { status: 404 })

  const body = await req.json()
  const {
    resourceId,
    canRead = false,
    canCreate = false,
    canUpdate = false,
    canDelete = false,
    canList = false,
    canExport = false,
    canApprove = false,
    canManage = false,
    specialPermission = 'NONE',
  } = body

  // Validation
  if (!resourceId) {
    return Response.json({ error: 'resourceId est requis' }, { status: 400 })
  }

  // Vérifier que la ressource existe et est active
  const resource = await prisma.permissionResource.findUnique({
    where: { id: resourceId },
  })
  if (!resource || !resource.isActive) {
    return Response.json({ error: 'Ressource introuvable ou inactive' }, { status: 404 })
  }

  // Vérifier doublon (la contrainte DB le ferait aussi, mais on renvoie un message clair)
  const existing = await prisma.rolePermission.findUnique({
    where: { roleId_resourceId: { roleId, resourceId } },
  })
  if (existing) {
    return Response.json(
      { error: 'Une permission existe déjà pour ce rôle et cette ressource' },
      { status: 409 }
    )
  }

  const permission = await prisma.rolePermission.create({
    data: {
      roleId,
      resourceId,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      canList,
      canExport,
      canApprove,
      canManage,
      specialPermission,
    },
    select: PERMISSION_SELECT,
  })

  return Response.json(permission, { status: 201 })
}