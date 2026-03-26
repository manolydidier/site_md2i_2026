import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { PostStatus } from "@/generated/prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/posts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
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
  try {
    const { id } = await params;
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
      tags,
    } = body;

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
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
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (
      body.slug !== undefined &&
      body.slug !== existing.slug
    ) {
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
        updatedAt: true,
      },
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
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    await prisma.postTag.deleteMany({
      where: { postId: id },
    });

    await prisma.post.delete({
      where: { id },
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