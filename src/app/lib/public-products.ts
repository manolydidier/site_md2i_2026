// src/app/lib/public-products.ts
// Jeu de résultats par défaut (page 1, aucun filtre, tri date desc) pour le
// rendu serveur initial de PublicProductsPage — utilisé par les deux pages
// qui montent ce composant (accueil + /produits). Réplique volontairement
// la requête par défaut de /api/products/public plutôt que d'appeler cette
// route en HTTP depuis le serveur (évite un aller-retour réseau superflu) ;
// PublicProductsPage ignore ce résultat dès que l'utilisateur filtre/trie.

import { prisma } from "./prisma";

const PAGE_SIZE = 9;

export type InitialProduct = {
  id: string;
  name: string;
  slug: string;
  excerpt: string | null;
  price: number | null;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  category: { id: string; name: string; slug: string | null } | null;
};

export type InitialProductCategory = { id: string; name: string; slug: string | null };

function toSerializableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object") {
    const record = value as { toNumber?: () => number };
    if (typeof record.toNumber === "function") {
      const parsed = record.toNumber();
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

export async function getInitialProducts(): Promise<{
  products: InitialProduct[];
  categories: InitialProductCategory[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} | null> {
  try {
    const now = new Date();
    const publishedWhere = { status: "PUBLISHED" as const, publishedAt: { not: null, lte: now } };

    const [products, total, categories] = await prisma.$transaction([
      prisma.product.findMany({
        where: publishedWhere,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          slug: true,
          excerpt: true,
          price: true,
          coverImage: true,
          publishedAt: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where: publishedWhere }),
      // Même source que le fetchCats() client (/api/product-categories,
      // page 1 / limit 20 par défaut) — pas seulement les catégories ayant
      // un produit publié.
      prisma.productCategory.findMany({
        orderBy: { name: "asc" },
        take: 20,
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return {
      products: products.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        excerpt: item.excerpt ?? null,
        price: toSerializableNumber(item.price),
        coverImage: item.coverImage ?? null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
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
