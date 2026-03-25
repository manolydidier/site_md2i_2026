// src/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },

      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            userRoles: {
              take: 1,
              orderBy: { assignedAt: 'desc' },
              include: { role: true },
            },
          },
        })

        if (!user) return null

        if (!user.emailVerified || user.status !== 'ACTIVE') {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) return null

        const role = user.userRoles?.[0]?.role ?? null

        return {
          id: user.id,
          email: user.email,
          role: role?.name ?? null,
          roleId: role?.id ?? null,
          roleCode: role?.code ?? null,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            userRoles: {
              take: 1,
              orderBy: { assignedAt: 'desc' },
              select: {
                role: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        })
// ── LOGS TEMPORAIRES ──────────────────────────────
  // console.log('[jwt] token.id:', token.id)
  // console.log('[jwt] userRoles trouvés:', JSON.stringify(dbUser?.userRoles))
  // ─────────────────────────────────────────────────
        const role = dbUser?.userRoles?.[0]?.role ?? null
        token.role     = role?.name ?? null
        token.roleId   = role?.id   ?? null
        token.roleCode = role?.code ?? null
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id       as string
        session.user.role     = token.role     as string | null
        session.user.roleId   = token.roleId   as string | null
        session.user.roleCode = token.roleCode as string | null
      }
      return session
    },
  },
})