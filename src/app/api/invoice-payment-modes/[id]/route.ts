// src/app/api/invoice-payment-modes/[id]/route.ts
// PATCH  /api/invoice-payment-modes/:id — mise à jour
// DELETE /api/invoice-payment-modes/:id — suppression douce

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.paymentMode.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Mode de paiement introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mode = await prisma.paymentMode.update({
    where: { id },
    data: {
      label: parsed.data.label ?? existing.label,
      isActive: parsed.data.isActive ?? existing.isActive,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    },
  });

  return NextResponse.json({ data: mode });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canDelete" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.paymentMode.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Mode de paiement introuvable." }, { status: 404 });
  }

  await prisma.paymentMode.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
