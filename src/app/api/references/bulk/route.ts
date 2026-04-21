import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// DELETE /api/references/bulk - Delete multiple references
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    const result = await prisma.reference.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("[DELETE /api/references/bulk]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}