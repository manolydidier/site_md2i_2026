// app/api/articles/[articleId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { articleId: string } }) {
  const { articleId } = params

  try {
    const article = await prisma.post.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return Response.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    return Response.json(article)
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}