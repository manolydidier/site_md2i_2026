import { NextRequest } from 'next/server'
import { withPermission } from '../../../../../(permisionGuard)/lib/permissions'
import { prisma } from '@/app/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await withPermission(req)

    if (!guard.ok) {
      return guard.response
    }

    const { id: userId } = await params

    if (userId === guard.session.user.id) {
      return Response.json(
        { error: 'Impossible de supprimer définitivement votre propre compte' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return Response.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return Response.json(
      { success: true, message: 'Utilisateur supprimé définitivement' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Erreur DELETE /api/users/[id]/hard :', err)

    const errorMessage =
      err instanceof Error ? err.message : 'Erreur inconnue'

    return Response.json(
      {
        error: 'Erreur serveur',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}