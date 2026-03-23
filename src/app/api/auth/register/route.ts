// app/api/auth/register/route.ts
// Après inscription : status ACTIVE + connexion automatique

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // ── Créer l'utilisateur en ACTIVE pour permettre la connexion auto ────
    await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        status:        'ACTIVE', // ← PENDING → ACTIVE pour auto-login
        emailVerified: false,
      },
    })

    // ── Retourner les credentials pour que le client connecte directement ─
    // Le client appellera signIn('credentials', ...) avec ces données
    return NextResponse.json({
      success: true,
      // On renvoie email pour que le front puisse appeler signIn directement
      // Ne jamais renvoyer le mot de passe en clair — on renvoie juste l'email
      autoLogin: { email },
    })

  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}