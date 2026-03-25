import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

// ─── Articles à créer ───────────────────────────────────────────────────────
const POSTS = [
  {
    title: 'Introduction à Next.js',
    slug: 'introduction-a-next-js',
    excerpt: 'Next.js est un framework React qui permet de créer des applications web modernes.',
    content: 'Voici le contenu complet de l\'article sur Next.js...',
    status: 'PUBLISHED', // Statut : 'DRAFT', 'PUBLISHED', ou 'ARCHIVED'
    publishedAt: new Date(),
    authorId: '47e5b5a5-87ca-49ec-8011-4ef03edb0162', // ID de l\'auteur (superadmin par exemple)
    categoryId: null,  // Vous pouvez lier à une catégorie si nécessaire
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Pourquoi utiliser Prisma ?',
    slug: 'pourquoi-utiliser-prisma',
    excerpt: 'Prisma est un ORM moderne pour Node.js et TypeScript, qui simplifie les requêtes SQL et gère la base de données.',
    content: 'Voici le contenu détaillé de l\'article expliquant pourquoi Prisma est si puissant...',
    status: 'PUBLISHED',
    publishedAt: new Date(),
    authorId: '47e5b5a5-87ca-49ec-8011-4ef03edb0162', // ID de l\'auteur
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Les meilleures pratiques React',
    slug: 'meilleures-pratiques-react',
    excerpt: 'Dans ce tutoriel, nous explorons les meilleures pratiques de développement avec React, y compris les hooks et la gestion d\'état.',
    content: 'Voici le contenu complet de l\'article sur les meilleures pratiques avec React...',
    status: 'PUBLISHED',
    publishedAt: new Date(),
    authorId: '47e5b5a5-87ca-49ec-8011-4ef03edb0162', // ID de l\'auteur
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Comprendre les Hooks React',
    slug: 'comprendre-les-hooks-react',
    excerpt: 'Les hooks de React ont été introduits pour gérer l\'état et les effets de manière fonctionnelle. Découvrons comment les utiliser.',
    content: 'Voici le contenu complet sur les hooks React...',
    status: 'PUBLISHED',
    publishedAt: new Date(),
    authorId: '47e5b5a5-87ca-49ec-8011-4ef03edb0162', // ID de l\'auteur
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function main() {
  console.log('🌱 Démarrage du seeder pour les articles…\n')

  // ── 1. Créer les articles ─────────────────────────────────────────────────
  for (const post of POSTS) {
    await prisma.post.upsert({
      where: { slug: post.slug }, // On upsert pour éviter les doublons par slug
      update: {},
      create: post,
    })
    console.log(`✅ Article : ${post.title}`)
  }

  // ── 2. Récapitulatif ───────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────')
  console.log('🎉 Seeder des articles terminé avec succès !')
  console.log('────────────────────────────────────')
  console.log(`📚 Nombre d\'articles créés : ${POSTS.length}`)
  console.log('────────────────────────────────────\n')
}

main()
  .catch(e => {
    console.error('❌ Erreur seeder :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())