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

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            // Seulement le rôle — pas les permissions (chargées à la demande)
            userRoles: {
              take: 1,
              include: {
                role: { select: { id: true, name: true, code: true } },
              },
            },
          },
        })

        if (!user || user.status !== 'ACTIVE') return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) return null

        const role = user.userRoles?.[0]?.role ?? null

        return {
          id:       user.id,
          email:    user.email,
          name:     `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          role:     role?.name ?? null,
          roleId:   role?.id   ?? null,
          roleCode: role?.code ?? null,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.role     = (user as any).role     ?? null
        token.roleId   = (user as any).roleId   ?? null
        token.roleCode = (user as any).roleCode ?? null
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