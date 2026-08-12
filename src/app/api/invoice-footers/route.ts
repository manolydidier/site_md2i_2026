// src/app/api/invoice-footers/route.ts
// GET  /api/invoice-footers — liste (hors soft-delete)
// POST /api/invoice-footers — création (lignes JSON structurées, jamais de HTML brut)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { textLinesSchema } from "@/app/lib/invoices/style";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(150),
  lines: textLinesSchema,
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

async function unsetOtherDefaults(exceptId?: string) {
  await prisma.invoiceFooter.updateMany({
    where: { deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const footers = await prisma.invoiceFooter.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: footers });
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

  const footer = await prisma.invoiceFooter.create({
    data: {
      name: parsed.data.name,
      lines: parsed.data.lines,
      isDefault: Boolean(parsed.data.isDefault),
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: footer }, { status: 201 });
}
