import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/references/stats - Get statistics
export async function GET() {
  try {
    const [
      totalProjects,
      countries,
      categories,
      byYear,
      byStatus,
      totalImpact,
    ] = await Promise.all([
      prisma.reference.count(),
      prisma.reference.groupBy({ by: ["country"] }),
      prisma.reference.groupBy({ by: ["category"] }),
      prisma.reference.groupBy({ by: ["date"] }),
      prisma.reference.groupBy({ by: ["status"] }),
      prisma.reference.aggregate({
        _sum: { lat: true },
      }),
    ]);

    return NextResponse.json({
      total: totalProjects,
      countries: countries.length,
      categories: categories.length,
      byYear: byYear.map(y => ({ year: y.date, count: y._count })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      topCategories: categories.sort((a, b) => b._count - a._count).slice(0, 5),
    });
  } catch (error) {
    console.error("[GET /api/references/stats]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}