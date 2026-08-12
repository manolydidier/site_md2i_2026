// src/app/api/invoice-suppliers/[id]/route.ts
// PATCH  /api/invoice-suppliers/:id — mise à jour
// DELETE /api/invoice-suppliers/:id — suppression douce

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().max(2000).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  statNumber: z.string().trim().max(100).optional().nullable(),
  nif: z.string().trim().max(100).optional().nullable(),
  rcs: z.string().trim().max(100).optional().nullable(),
  isDefault: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

async function unsetOtherDefaults(exceptId: string) {
  await prisma.invoiceSupplier.updateMany({
    where: { deletedAt: null, id: { not: exceptId } },
    data: { isDefault: false },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canUpdate" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.invoiceSupplier.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isDefault === true) {
    await unsetOtherDefaults(id);
  }

  const supplier = await prisma.invoiceSupplier.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      address: parsed.data.address === undefined ? existing.address : parsed.data.address || null,
      phone: parsed.data.phone === undefined ? existing.phone : parsed.data.phone || null,
      email: parsed.data.email === undefined ? existing.email : parsed.data.email || null,
      statNumber: parsed.data.statNumber === undefined ? existing.statNumber : parsed.data.statNumber || null,
      nif: parsed.data.nif === undefined ? existing.nif : parsed.data.nif || null,
      rcs: parsed.data.rcs === undefined ? existing.rcs : parsed.data.rcs || null,
      isDefault: parsed.data.isDefault ?? existing.isDefault,
    },
  });

  return NextResponse.json({ data: supplier });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canDelete" });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const existing = await prisma.invoiceSupplier.findFirst({ where: { id, deletedAt: null } });

  if (!existing) {
    return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });
  }

  await prisma.invoiceSupplier.update({
    where: { id },
    data: { deletedAt: new Date(), isDefault: false },
  });

  return NextResponse.json({ success: true });
}
