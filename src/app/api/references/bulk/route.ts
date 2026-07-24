import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { logAudit } from "@/(permisionGuard)/lib/audit";

// DELETE /api/references/bulk - Delete multiple references
export async function DELETE(request: NextRequest) {
  const guard = await withPermission(request, { resource: "references", action: "canDelete" });
  if (!guard.ok) return guard.response;

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

    await logAudit({
      actorId: guard.session.user.id,
      action: "bulk_delete",
      entity: "reference",
      metadata: { ids, count: result.count },
      req: request,
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