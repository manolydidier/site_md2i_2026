import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { PageStatus } from "@/generated/prisma/client";
import { isPrismaNotFound } from "@/app/lib/prisma-errors";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "pages", action: "canRead" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    }

    return NextResponse.json({ data: page });
  } catch (error) {
    console.error("[GET /api/pages/:id]", error);
    return NextResponse.json({ error: "Impossible de charger la page." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "pages", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.slug) {
      const conflict = await prisma.page.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });
      }
    }

    const status: PageStatus | undefined =
      body.status && body.status in PageStatus ? body.status : undefined;

    const existing = status
      ? await prisma.page.findUnique({ where: { id }, select: { publishedAt: true } })
      : null;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.slug === "string" && body.slug ? { slug: body.slug } : {}),
        ...(body.description !== undefined
          ? { description: typeof body.description === "string" ? body.description.trim() || null : null }
          : {}),
        ...(body.gjsComponents !== undefined ? { gjsComponents: body.gjsComponents } : {}),
        ...(body.gjsStyles !== undefined ? { gjsStyles: body.gjsStyles } : {}),
        ...(body.gjsHtml !== undefined
          ? { gjsHtml: typeof body.gjsHtml === "string" ? body.gjsHtml : null }
          : {}),
        ...(body.gjsJs !== undefined
          ? { gjsJs: typeof body.gjsJs === "string" ? body.gjsJs : null }
          : {}),
        ...(status
          ? {
              status,
              publishedAt:
                status === PageStatus.PUBLISHED ? existing?.publishedAt || new Date() : existing?.publishedAt ?? null,
            }
          : {}),
      },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: status !== undefined ? (status === PageStatus.PUBLISHED ? "publish" : "update") : "update",
      entity: "page",
      entityId: id,
      metadata: { title: page.title, slug: page.slug, status: page.status },
      req,
    });

    return NextResponse.json({ data: page });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    }
    console.error("[PATCH /api/pages/:id]", error);
    return NextResponse.json({ error: "Impossible de modifier la page." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "pages", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const existing = await prisma.page.findUnique({ where: { id }, select: { title: true, slug: true } });
    await prisma.page.delete({ where: { id } });

    await logAudit({
      actorId: guard.session.user.id,
      action: "delete",
      entity: "page",
      entityId: id,
      metadata: { title: existing?.title, slug: existing?.slug },
      req,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    }
    console.error("[DELETE /api/pages/:id]", error);
    return NextResponse.json({ error: "Impossible de supprimer la page." }, { status: 500 });
  }
}
