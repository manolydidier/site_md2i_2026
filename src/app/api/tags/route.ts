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

// GET reste public (utilisé par l'éditeur d'articles pour le sélecteur de
// tags) — pas de guard ici.
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error("GET /api/tags error:", error);

    return NextResponse.json(
      { error: "Impossible de charger les tags." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await withPermission(request, { resource: "tags", action: "canCreate" });
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du tag est requis." },
        { status: 400 }
      );
    }

    const finalSlug = slug?.trim() || slugifyName(name);

    const existing = await prisma.tag.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un tag avec ce slug existe déjà." },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error:", error);
    return NextResponse.json(
      { error: "Impossible de créer le tag." },
      { status: 500 }
    );
  }
}
