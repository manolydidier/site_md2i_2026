import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/posts/check-slug?slug=my-slug&excludeId=optional-post-id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { error: "slug param is required" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.trim();

    const where = excludeId
      ? {
          slug: normalizedSlug,
          NOT: { id: excludeId },
        }
      : {
          slug: normalizedSlug,
        };

    const existing = await prisma.post.findFirst({ where });

    return NextResponse.json({
      available: !existing,
    });
  } catch (error) {
    console.error("[GET /api/posts/check-slug]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}