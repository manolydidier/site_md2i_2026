// app/api/users/route.ts
import { NextRequest } from 'next/server'
import { withPermission } from '../../../(permisionGuard)/lib/permissions'
import { prisma } from '@/app/lib/prisma'

// ── GET /api/users — liste paginée + filtres + recherche ─────────────────────
export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { action: 'canList' })
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, parseInt(searchParams.get('page')   ?? '1'))
  const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
  const search   = searchParams.get('search')  ?? ''
  const status   = searchParams.get('status')  ?? ''
  const roleCode = searchParams.get('role')    ?? ''
  const sortBy   = searchParams.get('sortBy')  ?? 'createdAt'
  const sortDir  = searchParams.get('sortDir') ?? 'desc'

  const where: any = {
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      OR: [
        { email:     { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { username:  { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(roleCode && {
      userRoles: { some: { role: { code: roleCode } } },
    }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { [sortBy]: sortDir },
      select: {
        id: true, email: true, username: true,
        firstName: true, lastName: true, phone: true,
        avatarUrl: true, status: true, emailVerified: true,
        lastLoginAt: true, createdAt: true,
        userRoles: {
          include: { role: { select: { id: true, name: true, code: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return Response.json({
    data:       users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

// ── POST /api/users — créer un utilisateur ───────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await withPermission(req)
  if (!guard.ok) return guard.response

  const { firstName, lastName, email, password, username, phone, roleId } = await req.json()

  if (!email || !password) {
    return Response.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
  }

  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email, firstName, lastName, username, phone,
      passwordHash, status: 'ACTIVE', emailVerified: false,
      ...(roleId && {
        userRoles: { create: { roleId, assignedById: guard.session.user.id } },
      }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, status: true },
  })

  return Response.json(user, { status: 201 })
}