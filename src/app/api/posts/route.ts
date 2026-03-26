import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/app/lib/prisma'
import { PostStatus } from "@/generated/prisma/client";

// GET /api/posts - List all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PostStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, email: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { tags: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      coverImage,
      status = "DRAFT",
      publishedAt,
      authorId,
      categoryId,
      gjsComponents,
      gjsStyles,
      gjsHtml,
      tags = [],
    } = body;

    // Validation
    if (!title || !slug || !authorId) {
      return NextResponse.json(
        { error: "title, slug and authorId are required" },
        { status: 400 }
      );
    }

    const statusValue = status as PostStatus;

    // Check slug uniqueness
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    const post = await prisma.post.create({
      data: {
  title,
  slug,
  excerpt: excerpt || null,
  coverImage: coverImage || null,
  status: statusValue,           // ← utiliser statusValue
  publishedAt:
    statusValue === "PUBLISHED"
      ? publishedAt ? new Date(publishedAt) : new Date()
      : null,
  authorId,
  categoryId: categoryId || null,
  gjsComponents: gjsComponents ?? null,
  gjsStyles: gjsStyles ?? null,
  gjsHtml: gjsHtml || null,
  tags: tags.length > 0
    ? {
        create: tags.map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      }
    : undefined,
},
      include: {
        author: { select: { id: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}