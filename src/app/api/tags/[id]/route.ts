import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { isPrismaNotFound } from "@/app/lib/prisma-errors";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "tags", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug } = body;

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Le nom du tag est requis." },
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
      const conflict = await prisma.tag.findFirst({
        where: { slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Un tag avec ce slug existe déjà." },
          { status: 409 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Tag introuvable." }, { status: 404 });
    }
    console.error("PATCH /api/tags/:id error:", error);
    return NextResponse.json(
      { error: "Impossible de modifier le tag." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "tags", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    await prisma.tag.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Tag introuvable." }, { status: 404 });
    }
    console.error("DELETE /api/tags/:id error:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le tag." },
      { status: 500 }
    );
  }
}
