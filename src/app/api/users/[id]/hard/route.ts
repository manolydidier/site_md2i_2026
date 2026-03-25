import { NextRequest } from 'next/server'
import { withPermission } from '../../../../../(permisionGuard)/lib/permissions'
import { prisma } from '@/app/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // console.log('Requête DELETE reçue pour l\'utilisateur avec l\'ID:', params.id)  // Log de l'ID reçu

    // Vérification des permissions
    const guard = await withPermission(req)
    if (!guard.ok) {
      console.log('Permission refusée:', guard.response)
      return guard.response
    }

    // Empêcher l'auto-suppression définitive
    if (params.id === guard.session.user.id) {
      // console.log('Tentative de suppression du propre compte:', params.id)
      return Response.json(
        { error: 'Impossible de supprimer définitivement votre propre compte' },
        { status: 403 }
      )
    }

    // Vérification de l'ID utilisateur
    const userId = params.id
    // console.log('Vérification de l\'existence de l\'utilisateur avec ID:', userId)

    // Recherche de l'utilisateur dans la base de données
    const user = await prisma.user.findFirst({ where: { id: userId } })
    if (!user) {
      // console.log('Utilisateur introuvable pour l\'ID:', userId)
      return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Suppression définitive de l'utilisateur
    await prisma.user.delete({ where: { id: userId } })
    // console.log('Utilisateur supprimé définitivement avec ID:', userId)

    // Réponse après suppression réussie
    return Response.json({ success: true })

  } catch (err) {
    // console.error('Erreur lors de la suppression de l\'utilisateur:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ error: 'Erreur serveur', details: errorMessage }, { status: 500 })
  }
}