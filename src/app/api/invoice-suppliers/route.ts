// src/app/api/invoice-suppliers/route.ts
// GET  /api/invoice-suppliers — liste (hors soft-delete)
// POST /api/invoice-suppliers — création

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(255),
  address: z.string().trim().max(2000).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  statNumber: z.string().trim().max(100).optional().nullable(),
  nif: z.string().trim().max(100).optional().nullable(),
  rcs: z.string().trim().max(100).optional().nullable(),
  isDefault: z.boolean().optional(),
});

async function unsetOtherDefaults(exceptId?: string) {
  await prisma.invoiceSupplier.updateMany({
    where: { deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const suppliers = await prisma.invoiceSupplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: suppliers });
}

export async function POST(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canCreate" });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isDefault) {
    await unsetOtherDefaults();
  }

  const supplier = await prisma.invoiceSupplier.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      statNumber: parsed.data.statNumber || null,
      nif: parsed.data.nif || null,
      rcs: parsed.data.rcs || null,
      isDefault: Boolean(parsed.data.isDefault),
    },
  });

  return NextResponse.json({ data: supplier }, { status: 201 });
}
