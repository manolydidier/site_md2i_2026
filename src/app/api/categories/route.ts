import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

function slugifyName(name: string) {
  const normalized = name.trim().toLowerCase().normalize("NFD");
  const diacriticsPattern = new RegExp("[\\u0300-\\u036f]", "g");

  return normalized
    .replace(diacriticsPattern, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET reste public (utilisé par le blog public et l'éditeur d'articles pour
// le filtre/sélecteur de catégorie) — pas de guard ici.
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: "Impossible de charger les catégories." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await withPermission(request, { resource: "categories", action: "canCreate" });
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de la catégorie est requis." },
        { status: 400 }
      );
    }

    const finalSlug = slug?.trim() || slugifyName(name);

    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Une catégorie avec ce slug existe déjà." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: "Impossible de créer la catégorie." },
      { status: 500 }
    );
  }
}
