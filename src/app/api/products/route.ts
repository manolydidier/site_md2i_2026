// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ProductStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as ProductStatus | null;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const allowedSorts = ["createdAt", "updatedAt", "publishedAt", "name", "price"];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : "createdAt";

    const where: any = {};

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSort]: order },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("BODY /api/products:", body);

    const {
      name,
      slug,
      excerpt,
      price,
      coverImage,
      images = [],
      status = "DRAFT",
      publishedAt,
      authorId,
      categoryId,
      gjsComponents,
      gjsStyles,
      gjsHtml,
      gjsJs,
    } = body;

    if (!name || !slug || !authorId) {
      return NextResponse.json(
        { error: "name, slug and authorId are required", received: body },
        { status: 400 }
      );
    }

    const statusValue = status as ProductStatus;

    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    if (categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        excerpt: excerpt || null,
        price:
          price !== undefined && price !== null && price !== ""
            ? Number(price)
            : null,
        coverImage: coverImage || null,
        images: Array.isArray(images) ? images : [],
        status: statusValue,
        publishedAt:
          statusValue === "PUBLISHED"
            ? publishedAt
              ? new Date(publishedAt)
              : new Date()
            : null,
        authorId,
        categoryId: categoryId || null,
        gjsComponents: gjsComponents ?? null,
        gjsStyles: gjsStyles ?? null,
        gjsHtml: gjsHtml || null,
        gjsJs: gjsJs || null,
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
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}