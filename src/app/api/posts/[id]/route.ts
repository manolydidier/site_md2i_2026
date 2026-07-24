import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { PostStatus } from "@/generated/prisma/client";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";

type Params = {
  params: Promise<{ id: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function postNotFoundResponse() {
  return NextResponse.json({ error: "Post not found" }, { status: 404 });
}

function invalidPostIdResponse() {
  return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
}

// GET /api/posts/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "posts", action: "canRead" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return postNotFoundResponse();
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return postNotFoundResponse();
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Full update
export async function PUT(request: NextRequest, { params }: Params) {
  const guard = await withPermission(request, { resource: "posts", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return invalidPostIdResponse();
    }

    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      coverImage,
      status,
      publishedAt,
      categoryId,
      gjsComponents,
      gjsStyles,
      gjsHtml,
      gjsJs,
      tags,
    } = body;

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return postNotFoundResponse();
    }

    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.post.findUnique({
        where: { slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    let resolvedPublishedAt = existing.publishedAt;

    if (status === "PUBLISHED" && !existing.publishedAt) {
      resolvedPublishedAt = publishedAt ? new Date(publishedAt) : new Date();
    } else if (status === "DRAFT") {
      resolvedPublishedAt = null;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        ...(status !== undefined && { status: status as PostStatus }),
        publishedAt: resolvedPublishedAt,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        ...(gjsComponents !== undefined && { gjsComponents }),
        ...(gjsStyles !== undefined && { gjsStyles }),
        ...(gjsHtml !== undefined && { gjsHtml }),
        ...(gjsJs !== undefined && { gjsJs }),
        updatedAt: new Date(),
        ...(Array.isArray(tags) && {
          tags: {
            deleteMany: {},
            create: tags.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: "update",
      entity: "post",
      entityId: id,
      metadata: { title, slug, status },
      req: request,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[PUT /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Partial update
export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();

  // Bascule publier/dépublier (uniquement { status }) → canValidate / canCancel.
  // Toute autre modification → canUpdate.
  const isPublishToggle = Object.keys(body).every(k => k === "status");
  const action = isPublishToggle
    ? body.status === "PUBLISHED" ? "canValidate" : "canCancel"
    : "canUpdate";
  const guard = await withPermission(request, { resource: "posts", action });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return invalidPostIdResponse();
    }

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return postNotFoundResponse();
    }

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const slugConflict = await prisma.post.findUnique({
        where: { slug: body.slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.gjsComponents !== undefined) updateData.gjsComponents = body.gjsComponents;
    if (body.gjsStyles !== undefined) updateData.gjsStyles = body.gjsStyles;
    if (body.gjsHtml !== undefined) updateData.gjsHtml = body.gjsHtml;
    if (body.gjsJs !== undefined) updateData.gjsJs = body.gjsJs;

    if (body.status !== undefined) {
      updateData.status = body.status as PostStatus;

      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (body.status === "DRAFT") {
        updateData.publishedAt = null;
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        status: true,
        categoryId: true,
        gjsComponents: true,
        gjsStyles: true,
        gjsHtml: true,
        gjsJs: true,
        updatedAt: true,
      },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: isPublishToggle ? (body.status === "PUBLISHED" ? "publish" : "unpublish") : "update",
      entity: "post",
      entityId: id,
      metadata: { title: post.title, slug: post.slug, status: post.status },
      req: request,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[PATCH /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "posts", action: "canDelete" });
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!isUuid(id)) {
      return invalidPostIdResponse();
    }

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return postNotFoundResponse();
    }

    await prisma.postTag.deleteMany({
      where: { postId: id },
    });

    await prisma.post.delete({
      where: { id },
    });

    await logAudit({
      actorId: guard.session.user.id,
      action: "delete",
      entity: "post",
      entityId: id,
      metadata: { title: existing.title, slug: existing.slug },
      req,
    });

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
