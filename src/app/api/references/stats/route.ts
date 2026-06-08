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
    ] = await Promise.all([
      prisma.reference.count(),
      prisma.reference.groupBy({ by: ["country"], _count: { _all: true } }),
      prisma.reference.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.reference.groupBy({ by: ["date"], _count: { _all: true } }),
      prisma.reference.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return NextResponse.json({
      total: totalProjects,
      countries: countries.length,
      categories: categories.length,
      byYear: byYear.map(y => ({ year: y.date, count: y._count._all })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count._all })),
      topCategories: categories
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 5)
        .map(category => ({
          category: category.category,
          count: category._count._all,
        })),
    });
  } catch (error) {
    console.error("[GET /api/references/stats]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
