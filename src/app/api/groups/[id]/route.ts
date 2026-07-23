// app/api/groups/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { groupSchema } from "@/app/lib/email/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "groups", action: "canUpdate" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  const { id } = await params;

  const body = await req.json();

  const parsed = groupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.contactGroup.updateMany({
    where: {
      id,
      userId: session.user.id,
    },
    data: parsed.data,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await withPermission(req, { resource: "groups", action: "canDelete" });
  if (!guard.ok) return guard.response;
  const session = guard.session;

  const { id } = await params;

  await prisma.contactGroup.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
