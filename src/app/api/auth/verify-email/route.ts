// app/api/auth/verify-email/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) return Response.json({ error: 'Email et code requis' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    // Trouver le token valide
    const token = await prisma.authToken.findFirst({
      where: {
        userId:    user.id,
        token:     code,
        type:      'EMAIL_VERIFICATION',
        usedAt:    null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!token) {
      // Vérifier si le code existe mais est expiré (pour donner un message précis)
      const expired = await prisma.authToken.findFirst({
        where: { userId: user.id, token: code, type: 'EMAIL_VERIFICATION', usedAt: null },
      })
      if (expired) return Response.json({ error: 'Code expiré. Demandez un nouveau code.' }, { status: 400 })
      return Response.json({ error: 'Code incorrect.' }, { status: 400 })
    }

    // Marquer le token comme utilisé + vérifier l'email en une transaction
    await prisma.$transaction([
      prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, status: 'ACTIVE' } }),
    ])

    return Response.json({ success: true })
  } catch (err) {
    console.error('[verify-email]', err)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}