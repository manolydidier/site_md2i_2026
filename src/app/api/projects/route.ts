import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { ProjectStatus } from "@/generated/prisma/client";

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
  const baseSlug = slugify(base) || "projet";
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.project.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "projects", action: "canList" });
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
      ...(status && status in ProjectStatus ? { status: status as ProjectStatus } : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json({ error: "Impossible de charger les projets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "projects", action: "canCreate" });
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

    const status: ProjectStatus =
      body.status && body.status in ProjectStatus ? body.status : ProjectStatus.DRAFT;

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() || null : null,
        coverImage: typeof body.coverImage === "string" ? body.coverImage.trim() || null : null,
        images: normalizeStringArray(body.images),
        techStack: normalizeStringArray(body.techStack),
        projectUrl: typeof body.projectUrl === "string" ? body.projectUrl.trim() || null : null,
        githubUrl: typeof body.githubUrl === "string" ? body.githubUrl.trim() || null : null,
        gjsHtml: typeof body.gjsHtml === "string" ? body.gjsHtml : null,
        status,
        publishedAt: status === ProjectStatus.PUBLISHED ? new Date() : null,
        authorId: guard.session.user.id,
      },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json({ error: "Impossible de créer le projet." }, { status: 500 });
  }
}
