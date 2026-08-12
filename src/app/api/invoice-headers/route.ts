// src/app/api/invoice-headers/route.ts
// GET  /api/invoice-headers — liste (hors soft-delete)
// POST /api/invoice-headers — création (imageUrl déjà uploadée via /api/upload)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(150),
  imageUrl: z.string().trim().min(1, "Image requise").max(2000),
  altText: z.string().trim().max(255).optional().nullable(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

async function unsetOtherDefaults(exceptId?: string) {
  await prisma.invoiceHeader.updateMany({
    where: { deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const headers = await prisma.invoiceHeader.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: headers });
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

  const header = await prisma.invoiceHeader.create({
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      altText: parsed.data.altText || null,
      isDefault: Boolean(parsed.data.isDefault),
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: header }, { status: 201 });
}
