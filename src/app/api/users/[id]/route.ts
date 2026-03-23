import { NextRequest } from 'next/server'
import { withPermission } from '../../../../(permisionGuard)/lib/permissions'
import { prisma } from '@/app/lib/prisma'

type Ctx = {
  params: Promise<{ id: string }>
}

// ── GET /api/users/:id ───────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Ctx) {
  const guard = await withPermission(req)
  if (!guard.ok) return guard.response

  const { id } = await params

  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        include: {
          role: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  })

  if (!user) {
    return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  return Response.json(user)
}

// ── PUT /api/users/:id — modifier ────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await withPermission(req)
  if (!guard.ok) return guard.response

  const { id } = await params
  const { firstName, lastName, username, phone, email, roleId } = await req.json()

  if (email) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
    })

    if (existing) {
      return Response.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(username !== undefined && { username }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  })

  if (roleId !== undefined) {
    await prisma.userRole.deleteMany({ where: { userId: id } })

    if (roleId) {
      await prisma.userRole.create({
        data: {
          userId: id,
          roleId,
          assignedById: guard.session.user.id,
        },
      })
    }
  }

  return Response.json(user)
}

// ── PATCH /api/users/:id — changer le statut ─────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await withPermission(req)
  if (!guard.ok) return guard.response

  const { id } = await params
  const { status } = await req.json()

  const allowed = ['ACTIVE', 'SUSPENDED', 'PENDING']
  if (!allowed.includes(status)) {
    return Response.json({ error: 'Statut invalide' }, { status: 400 })
  }

  if (id === guard.session.user.id) {
    return Response.json(
      { error: 'Vous ne pouvez pas modifier votre propre statut' },
      { status: 400 }
    )
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  })

  return Response.json(user)
}

// ── DELETE /api/users/:id — soft delete ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const guard = await withPermission(req)
  if (!guard.ok) return guard.response

  const { id } = await params

  if (id === guard.session.user.id) {
    return Response.json(
      { error: 'Vous ne pouvez pas supprimer votre propre compte' },
      { status: 400 }
    )
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'DELETED' },
  })

  return Response.json({ success: true })
}