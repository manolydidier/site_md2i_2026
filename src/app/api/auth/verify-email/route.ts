import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email et code requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email déjà vérifié' }, { status: 400 })
    }

    // Chercher token valide
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
      const expired = await prisma.authToken.findFirst({
        where: { userId: user.id, token: code, type: 'EMAIL_VERIFICATION', usedAt: null },
      })
      if (expired) {
        return NextResponse.json(
          { error: 'Code expiré. Demandez un nouveau code.' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Code incorrect.' }, { status: 400 })
    }

    // ✅ Activer le user + invalider le token en une transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data:  { emailVerified: true, status: 'ACTIVE' },
      }),
      prisma.authToken.update({
        where: { id: token.id },
        data:  { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}