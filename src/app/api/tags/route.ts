import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error("GET /api/tags error:", error);

    return NextResponse.json(
      { error: "Impossible de charger les tags." },
      { status: 500 }
    );
  }
}