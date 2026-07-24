import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";
import { PageStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function buildUniqueSlug(base: string) {
  const baseSlug = slugify(base) || "page";
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.page.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "pages", action: "canList" });
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status && status in PageStatus ? { status: status as PageStatus } : {}),
    };

    const [pages, total] = await Promise.all([
      prisma.page.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.page.count({ where }),
    ]);

    return NextResponse.json({
      data: pages,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET /api/pages]", error);
    return NextResponse.json({ error: "Impossible de charger les pages." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "pages", action: "canCreate" });
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    }

    const slug = await buildUniqueSlug(
      typeof body.slug === "string" && body.slug.trim() ? body.slug : title
    );

    const status: PageStatus =
      body.status && body.status in PageStatus ? body.status : PageStatus.DRAFT;

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        gjsComponents: body.gjsComponents ?? null,
        gjsStyles: body.gjsStyles ?? null,
        gjsHtml: typeof body.gjsHtml === "string" ? body.gjsHtml : null,
        gjsJs: typeof body.gjsJs === "string" ? body.gjsJs : null,
        status,
        publishedAt: status === PageStatus.PUBLISHED ? new Date() : null,
        authorId: guard.session.user.id,
      },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: "create",
      entity: "page",
      entityId: page.id,
      metadata: { title: page.title, slug: page.slug, status: page.status },
      req,
    });

    return NextResponse.json({ data: page }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pages]", error);
    return NextResponse.json({ error: "Impossible de créer la page." }, { status: 500 });
  }
}
