import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isPrismaNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "categories", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description } = body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Le nom de la catégorie est requis." },
        { status: 400 }
      );
    }

    if (slug !== undefined && (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug))) {
      return NextResponse.json(
        { error: "Slug invalide (minuscules, chiffres et tirets)." },
        { status: 400 }
      );
    }

    if (slug) {
      const conflict = await prisma.category.findFirst({
        where: { slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Une catégorie avec ce slug existe déjà." },
          { status: 409 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
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

    return NextResponse.json(category);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
    }
    console.error("PATCH /api/categories/:id error:", error);
    return NextResponse.json(
      { error: "Impossible de modifier la catégorie." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "categories", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    await prisma.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
    }
    console.error("DELETE /api/categories/:id error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer la catégorie." },
      { status: 500 }
    );
  }
}
