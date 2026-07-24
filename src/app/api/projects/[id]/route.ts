import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { ProjectStatus } from "@/generated/prisma/client";
import { isPrismaNotFound } from "@/app/lib/prisma-errors";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "projects", action: "canRead" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("[GET /api/projects/:id]", error);
    return NextResponse.json({ error: "Impossible de charger le projet." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "projects", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();

    if (body.slug) {
      const conflict = await prisma.project.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (conflict) {
        return NextResponse.json({ error: "Ce slug est déjà utilisé." }, { status: 409 });
      }
    }

    const status: ProjectStatus | undefined =
      body.status && body.status in ProjectStatus ? body.status : undefined;

    const existing = status
      ? await prisma.project.findUnique({ where: { id }, select: { publishedAt: true } })
      : null;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.slug === "string" && body.slug ? { slug: body.slug } : {}),
        ...(body.excerpt !== undefined
          ? { excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() || null : null }
          : {}),
        ...(body.coverImage !== undefined
          ? { coverImage: typeof body.coverImage === "string" ? body.coverImage.trim() || null : null }
          : {}),
        ...(body.images !== undefined ? { images: normalizeStringArray(body.images) } : {}),
        ...(body.techStack !== undefined ? { techStack: normalizeStringArray(body.techStack) } : {}),
        ...(body.projectUrl !== undefined
          ? { projectUrl: typeof body.projectUrl === "string" ? body.projectUrl.trim() || null : null }
          : {}),
        ...(body.githubUrl !== undefined
          ? { githubUrl: typeof body.githubUrl === "string" ? body.githubUrl.trim() || null : null }
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
                status === ProjectStatus.PUBLISHED ? existing?.publishedAt || new Date() : existing?.publishedAt ?? null,
            }
          : {}),
      },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: status !== undefined ? (status === ProjectStatus.PUBLISHED ? "publish" : "update") : "update",
      entity: "project",
      entityId: id,
      metadata: { title: project.title, slug: project.slug, status: project.status },
      req,
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    console.error("[PATCH /api/projects/:id]", error);
    return NextResponse.json({ error: "Impossible de modifier le projet." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "projects", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id }, select: { title: true, slug: true } });
    await prisma.project.delete({ where: { id } });

    await logAudit({
      actorId: guard.session.user.id,
      action: "delete",
      entity: "project",
      entityId: id,
      metadata: { title: existing?.title, slug: existing?.slug },
      req,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    console.error("[DELETE /api/projects/:id]", error);
    return NextResponse.json({ error: "Impossible de supprimer le projet." }, { status: 500 });
  }
}
