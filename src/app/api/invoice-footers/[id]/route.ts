// src/app/api/invoice-footers/[id]/route.ts
// PATCH  /api/invoice-footers/:id — mise à jour
// DELETE /api/invoice-footers/:id — suppression douce

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { textLinesSchema } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  lines: textLinesSchema.optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

async function unsetOtherDefaults(exceptId: string) {
  await prisma.invoiceFooter.updateMany({
    where: { deletedAt: null, id: { not: exceptId } },
    data: { isDefault: false },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.invoiceFooter.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Pied de page introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isDefault === true) {
    await unsetOtherDefaults(id);
  }

  const footer = await prisma.invoiceFooter.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      lines: parsed.data.lines ?? existing.lines ?? [],
      isDefault: parsed.data.isDefault ?? existing.isDefault,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    },
  });

  return NextResponse.json({ data: footer });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canDelete" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.invoiceFooter.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Pied de page introuvable." }, { status: 404 });
  }

  await prisma.invoiceFooter.update({
    where: { id },
    data: { deletedAt: new Date(), isDefault: false },
  });

  return NextResponse.json({ success: true });
}
