// src/app/api/clients/route.ts
// GET  /api/clients — liste (hors soft-delete)
// POST /api/clients — création (contenu riche HTML, nettoyé côté serveur)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { withPermission } from "@/(permisionGuard)/lib/permissions";
import { sanitizeRichHtml } from "@/app/lib/invoices/sanitize-html";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(255),
  content: z.string().max(20000).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

async function unsetOtherDefaults(exceptId?: string) {
  await prisma.client.updateMany({
    where: { deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  });
}

export async function GET(req: NextRequest) {
  const guard = await withPermission(req, { resource: "invoice_settings", action: "canList" });
  if (!guard.ok) return guard.response;

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: clients });
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

  const client = await prisma.client.create({
    data: {
      name: parsed.data.name,
      content: sanitizeRichHtml(parsed.data.content || ""),
      isDefault: Boolean(parsed.data.isDefault),
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: client }, { status: 201 });
}
