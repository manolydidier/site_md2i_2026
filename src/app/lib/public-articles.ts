// src/app/lib/public-articles.ts
// Jeu de résultats par défaut (page 1, aucun filtre, tri date desc) pour le
// rendu serveur initial de PublicArticlesPage — utilisé par les deux pages
// qui montent ce composant (accueil + /articles). Réplique volontairement
// la requête par défaut de /api/articles/public plutôt que d'appeler cette
// route en HTTP depuis le serveur (évite un aller-retour réseau superflu) ;
// PublicArticlesPage ignore ce résultat dès que l'utilisateur filtre/trie.

import { prisma } from "./prisma";
import { PostStatus } from "@/generated/prisma/client";

const PAGE_SIZE = 9;

export type InitialArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
};

export type InitialArticleCategory = { id: string; name: string; slug: string };

export async function getInitialArticles(): Promise<{
  articles: InitialArticle[];
  categories: InitialArticleCategory[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} | null> {
  try {
    const [articles, total, categories] = await Promise.all([
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      // Même source que le fetchCats() client (/api/categories) — toutes les
      // catégories, pas seulement celles utilisées par un article publié.
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      articles: articles.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        coverImage: item.coverImage,
        createdAt: item.createdAt.toISOString(),
        category: item.category,
      })),
      categories,
      pagination: {
        page: 1,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    };
  } catch {
    return null;
  }
}
